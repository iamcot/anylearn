package com.anylearn.backend.service.lifecycle;

import com.anylearn.backend.config.PaymentConfig;
import com.anylearn.backend.entity.ItemSchedule;
import com.anylearn.backend.entity.ScheduleRequest;
import com.anylearn.backend.entity.SessionAttendance;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ScheduleRequestRepository;
import com.anylearn.backend.repository.SessionAttendanceRepository;
import com.anylearn.backend.repository.UserCourseEnrollmentRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.today.DateRange;
import com.anylearn.backend.service.today.EnrollmentContext;
import com.anylearn.backend.service.today.LearnerData;
import com.anylearn.backend.service.today.LearnerLoader;
import com.anylearn.backend.service.today.Session;
import com.anylearn.backend.service.today.SessionSchedule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.OptionalInt;

/**
 * Messages along an enrollment (plan 07): before the course starts, when a learner keeps missing and in the middle of the
 * course (renewal and fee reminders stay in ScheduleNotificationService, which reads the same settings). Each message goes to the app (bell + push) and by email.
 * `lifecycle_messages` holds one row per message ever sent, with a unique key, so nothing goes out twice.
 * Called from the hourly scan of ScheduleNotificationService; all numbers come from {@link LifecycleSettings}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LifecycleService {

    public static final String TYPE_START = "lifecycle_start";
    public static final String TYPE_ABSENT = "lifecycle_absent";
    public static final String TYPE_SURVEY = "lifecycle_survey";
    public static final String TYPE_RENEWAL = "schedule_renewal";
    public static final String TYPE_ALERT = "system_notif";

    private static final int RECENT_MISS_DAYS = 14;

    private final JdbcTemplate jdbc;
    private final LifecycleSettings settings;
    private final LearnerLoader learnerLoader;
    private final SessionSchedule sessionSchedule;
    private final SessionAttendanceRepository attendanceRepository;
    private final ScheduleRequestRepository scheduleRequestRepository;
    private final UserCourseEnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final PaymentConfig paymentConfig;
    private final Clock clock;
    private final AttendanceRewardService attendanceRewards;

    /** Runs every hour. Messages are only sent inside the sending hours; a step skipped at night is picked up in the morning. */
    public void scan() {
        if (!settings.enabled()) return;
        LocalDateTime now = LocalDateTime.now(clock);
        if (!LifecycleRules.inWindow(now.getHour(), settings.sendFromHour(), settings.sendToHour())) return;
        for (Long learnerId : enrollmentRepository.findActiveLearnerIds()) {
            try {
                scanLearner(learnerId, now);
            } catch (Exception e) {
                log.warn("Lifecycle: learner {} failed: {}", learnerId, e.getMessage());
            }
        }
    }

    private void scanLearner(Long learnerId, LocalDateTime now) {
        User learner = userRepository.findById(learnerId).orElse(null);
        if (learner == null) return;
        LearnerData data = learnerLoader.load(learnerId);
        for (EnrollmentContext context : data.contexts()) {
            if (!context.hasSchedule() || context.isFee()) continue;
            beforeStart(learner, context, now);
            if (settings.absentEnabled()) absences(learner, context, now);
            attendanceRewards.check(learner, context, now);
            midCourse(learner, context, now);
        }
    }

    // ── 07.2 before the first session ─────────────────────────────────────────

    private void beforeStart(User learner, EnrollmentContext context, LocalDateTime now) {
        List<Session> sessions = sessionSchedule.wholePeriod(context);
        Optional<Session> first = sessions.stream().min(Comparator.comparing(Session::startAt));
        if (first.isEmpty() || first.get().hasEndedBy(now)) return;
        long daysLeft = ChronoUnit.DAYS.between(now.toLocalDate(), first.get().date());
        if (now.toLocalDate().isAfter(first.get().date()) || attendedAny(learner.getId(), context)) return;
        OptionalInt due = LifecycleRules.dueDay(daysLeft, settings.preStartDays());
        if (due.isEmpty()) return;
        Long enrollmentId = context.enrollment().getId();
        if (!claim(enrollmentId, learner, "start-" + due.getAsInt(), "start:%d:%d".formatted(enrollmentId, due.getAsInt()))) return;

        ItemSchedule schedule = context.schedule();
        String name = displayName(learner);
        String time = first.get().start() == null ? null : first.get().start().toString().substring(0, 5);
        String title = LifecycleMessages.startTitle(daysLeft);
        String content = LifecycleMessages.startContent(name, context.item().getTitle(), first.get().date(), time, daysLeft, schedule);
        deliver(accountIdOf(learner), TYPE_START, title, content, todayRoute(learner), "email-lifecycle_start",
                title + ": " + context.item().getTitle(),
                Map.of("learnerName", name, "itemTitle", context.item().getTitle(),
                        "startDate", first.get().date().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")) + (time == null ? "" : " lúc " + time),
                        "daysText", daysLeft <= 0 ? "hôm nay" : daysLeft == 1 ? "ngày mai" : "sau " + daysLeft + " ngày",
                        "classInfo", html(LifecycleMessages.classInfo(context.item().getTitle(), schedule)),
                        "todayUrl", todayUrl(learner)));
    }

    // ── 07.3 absences ─────────────────────────────────────────────────────────

    private void absences(User learner, EnrollmentContext context, LocalDateTime now) {
        if (!attendedAny(learner.getId(), context)) return; // attendance is not recorded for this class: no way to tell
        List<Session> ended = sessionSchedule.wholePeriod(context).stream()
                .filter(session -> session.hasEndedBy(now))
                .sorted(Comparator.comparing(Session::startAt))
                .toList();
        if (ended.isEmpty()) return;
        List<Boolean> present = new ArrayList<>();
        for (Session session : ended) present.add(covered(learner.getId(), context, session));
        int misses = LifecycleRules.trailingMisses(present);
        if (misses < settings.absentStreak()) return;
        LocalDate lastMissed = ended.get(ended.size() - 1).date();
        if (lastMissed.isBefore(now.toLocalDate().minusDays(RECENT_MISS_DAYS))) return; // old history, nobody to call about it now
        Long enrollmentId = context.enrollment().getId();
        if (!claim(enrollmentId, learner, "absent", "absent:%d:%s".formatted(enrollmentId, lastMissed))) return;

        String name = displayName(learner);
        String itemTitle = context.item().getTitle();
        deliver(accountIdOf(learner), TYPE_ABSENT, "Bé vắng học liên tiếp",
                LifecycleMessages.absentContent(name, itemTitle, misses), todayRoute(learner), "email-lifecycle_absent",
                "%s vắng %d buổi liền ở %s".formatted(name, misses, itemTitle),
                Map.of("learnerName", name, "itemTitle", itemTitle, "misses", String.valueOf(misses), "todayUrl", todayUrl(learner)));
        alertAdmins("Học viên vắng liên tiếp",
                "%s (id %d) vắng %d buổi liền ở %s. Nên gọi hỏi thăm phụ huynh.".formatted(name, learner.getId(), misses, itemTitle));
    }

    /** True when the learner has any attendance row for this class (so we know attendance is recorded). */
    private boolean attendedAny(Long learnerId, EnrollmentContext context) {
        DateRange period = sessionSchedule.periodOf(context);
        if (period.from() == null) return false;
        LocalDate to = period.to() != null ? period.to() : LocalDate.now(clock);
        return attendanceRepository.findByLearnerIdAndSessionDateBetween(learnerId, period.from(), to).stream()
                .anyMatch(row -> context.schedule().getId().equals(row.getItemScheduleId())
                        && SessionAttendance.STATUS_ATTENDED.equals(row.getStatus()));
    }

    private boolean covered(Long learnerId, EnrollmentContext context, Session session) {
        Long scheduleId = context.schedule().getId();
        boolean attended = attendanceRepository
                .findByLearnerIdAndItemScheduleIdAndSessionDate(learnerId, scheduleId, session.date()).isPresent();
        return attended || scheduleRequestRepository.existsByLearnerIdAndItemScheduleIdAndSessionDateAndStatus(
                learnerId, scheduleId, session.date(), ScheduleRequest.STATUS_APPROVED);
    }

    // ── 07.4 survey in the middle of the course ───────────────────────────────

    private void midCourse(User learner, EnrollmentContext context, LocalDateTime now) {
        List<Session> sessions = sessionSchedule.wholePeriod(context);
        int total = context.purchasedSessions() != null ? context.purchasedSessions() : sessions.size();
        int ended = (int) sessions.stream().filter(session -> session.hasEndedBy(now)).count();
        if (!LifecycleRules.surveyDue(Math.min(ended, total), total, settings.surveyPercent())) return;
        Long enrollmentId = context.enrollment().getId();
        if (hasFeedback(enrollmentId) || !claim(enrollmentId, learner, "survey", "survey:" + enrollmentId)) return;

        String name = displayName(learner);
        String itemTitle = context.item().getTitle();
        String route = todayRoute(learner) + "&survey=" + enrollmentId;
        deliver(accountIdOf(learner), TYPE_SURVEY, "Bé học có vui không?",
                LifecycleMessages.surveyContent(name, itemTitle), route, "email-lifecycle_survey",
                "Bé học %s có vui không?".formatted(itemTitle),
                Map.of("learnerName", name, "itemTitle", itemTitle, "surveyUrl", frontend() + route));
    }

    private boolean hasFeedback(Long enrollmentId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM enrollment_feedback WHERE enrollment_id = ?", Integer.class, enrollmentId);
        return count != null && count > 0;
    }

    // ── shared helpers ────────────────────────────────────────────────────────

    /** True when this message was not sent before (the unique key is taken now). */
    boolean claim(Long enrollmentId, User learner, String stage, String dedupKey) {
        int rows = jdbc.update(
                "INSERT IGNORE INTO lifecycle_messages (enrollment_id, learner_id, user_id, stage, dedup_key) VALUES (?, ?, ?, ?, ?)",
                enrollmentId, learner.getId(), accountIdOf(learner), stage, dedupKey);
        return rows == 1;
    }

    private void deliver(Long userId, String type, String title, String content, String route,
                         String templateKey, String subject, Map<String, String> vars) {
        notificationService.createNotification(userId, type, title, content, route);
        notificationService.emailTemplate(userId, type, templateKey, subject, vars);
    }

    private void alertAdmins(String title, String content) {
        try {
            userRepository.findAdminNotificationRecipients().forEach(admin ->
                    notificationService.createNotification(admin.getId(), TYPE_ALERT, title, content, "/admin/dashboard", null));
        } catch (Exception e) {
            log.warn("Lifecycle: admin alert failed: {}", e.getMessage());
        }
    }

    /** Class details of every enrollment made by an order, as html for the order confirmation email (empty when none). */
    public String classInfoOfOrder(Long orderId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT i.title AS item_title, s.gather_time, s.location_note, s.meeting_url, s.bring_items
                FROM user_course_enrollments e JOIN items i ON i.id = e.item_id
                LEFT JOIN item_schedules s ON s.id = e.schedule_id
                WHERE e.order_id = ?""", orderId);
        List<String> blocks = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            ItemSchedule schedule = new ItemSchedule();
            schedule.setGatherTime((String) row.get("gather_time"));
            schedule.setLocationNote((String) row.get("location_note"));
            schedule.setMeetingUrl((String) row.get("meeting_url"));
            schedule.setBringItems((String) row.get("bring_items"));
            blocks.add(LifecycleMessages.classInfo(String.valueOf(row.get("item_title")), schedule));
        }
        return html(String.join("\n", blocks));
    }

    public String todayUrl(Long learnerId) {
        return frontend() + "/today?child=" + learnerId;
    }

    private String todayUrl(User learner) {
        return todayUrl(learner.getId());
    }

    private String frontend() {
        return paymentConfig.getFrontendUrl();
    }

    static String html(String text) {
        return HtmlUtils.htmlEscape(text == null ? "" : text).replace("\n", "<br>");
    }

    private Long accountIdOf(User learner) {
        boolean isChild = Byte.valueOf((byte) 1).equals(learner.getIsChild()) && learner.getUserId() != null;
        return isChild ? learner.getUserId() : learner.getId();
    }

    private String displayName(User learner) {
        return Byte.valueOf((byte) 1).equals(learner.getIsChild()) ? learner.getName() : "Bạn";
    }

    private String todayRoute(User learner) {
        return "/today?child=" + learner.getId();
    }
}
