package com.anylearn.backend.service.video;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.today.LearnerLoader;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.sql.Time;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Self-study plans of video courses and their reminders (plan 17.5). A learner picks weekdays and a time per course
 * (`video_study_plans`); at that time the account gets `video_study_reminder` (bell + push, topic `schedule`) unless the
 * learner already studied the course that day. A course left unfinished for `video/idle_remind_days` gets one gentle
 * `video_idle` nudge per pause. Every message is claimed in `lifecycle_messages` first, so nothing goes out twice.
 */
@lombok.extern.slf4j.Slf4j
@Service
@RequiredArgsConstructor
public class VideoStudyService {

    /** Minutes after the planned time in which the reminder may still go out (the job runs every 15 minutes). */
    static final int WINDOW_MINUTES = 20;

    private final JdbcTemplate jdbc;
    private final LearnerLoader learnerLoader;
    private final VideoLearnService learn;
    private final VideoSettings settings;
    private final NotificationService notifications;
    private final Clock clock;

    static Map<String, Object> planView(Map<String, Object> row) {
        List<Integer> days = VideoCourseRules.parseWeekdays((String) row.get("weekdays"));
        LocalTime time = row.get("studyTime") instanceof Time t ? t.toLocalTime() : row.get("studyTime") instanceof LocalTime lt ? lt : null;
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", row.get("id"));
        out.put("weekdays", days);
        out.put("time", time == null ? null : String.format("%02d:%02d", time.getHour(), time.getMinute()));
        out.put("lessonsPerSession", row.get("lessonsPerSession"));
        out.put("enabled", VideoCourseAdminService.truthy(row.get("enabled")));
        out.put("text", VideoCourseRules.planText(days, time));
        return out;
    }

    public Map<String, Object> plan(User account, long learnerId, long itemId) {
        learnerLoader.require(account, learnerId);
        return jdbc.queryForList("SELECT id, weekdays, study_time AS studyTime, lessons_per_session AS lessonsPerSession, enabled FROM video_study_plans " +
                "WHERE learner_id = ? AND item_id = ?", learnerId, itemId).stream().findFirst().map(VideoStudyService::planView).orElse(null);
    }

    public Map<String, Object> savePlan(User account, long learnerId, long itemId, List<Integer> weekdays, String time, int lessonsPerSession, boolean enabled) {
        learnerLoader.require(account, learnerId);
        if (!learn.hasAccess(account, itemId)) throw new IllegalArgumentException("Bạn chưa đăng ký khóa học này");
        LocalTime t;
        try {
            t = time == null ? null : LocalTime.parse(time.length() == 5 ? time : time.substring(0, 5));
        } catch (Exception e) {
            t = null;
        }
        List<Integer> days = VideoCourseRules.parseWeekdays(VideoCourseRules.weekdaysText(weekdays == null ? List.of() : weekdays));
        String problem = VideoCourseRules.planProblem(days, t, lessonsPerSession);
        if (problem != null) throw new IllegalArgumentException(problem);
        jdbc.update("""
                INSERT INTO video_study_plans (learner_id, user_id, item_id, weekdays, study_time, lessons_per_session, enabled)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), weekdays = VALUES(weekdays), study_time = VALUES(study_time),
                  lessons_per_session = VALUES(lessons_per_session), enabled = VALUES(enabled)""",
                learnerId, account.getId(), itemId, VideoCourseRules.weekdaysText(days), Time.valueOf(t), lessonsPerSession, enabled ? 1 : 0);
        return plan(account, learnerId, itemId);
    }

    public void deletePlan(User account, long learnerId, long itemId) {
        learnerLoader.require(account, learnerId);
        jdbc.update("DELETE FROM video_study_plans WHERE learner_id = ? AND item_id = ?", learnerId, itemId);
    }

    /**
     * For /today: courses in progress (at most 2, latest first) and today's study plans with their time.
     */
    public Map<String, Object> today(User account, Long learnerId) {
        List<Map<String, Object>> mine = learn.myCourses(account, learnerId);
        int weekday = LocalDate.now(clock).getDayOfWeek().getValue();
        List<Map<String, Object>> going = new ArrayList<>();
        List<Map<String, Object>> sessions = new ArrayList<>();
        for (Map<String, Object> c : mine) {
            int percent = ((Number) c.get("percent")).intValue();
            if (c.get("plan") instanceof Map<?, ?> plan && Boolean.TRUE.equals(plan.get("enabled"))
                    && plan.get("weekdays") instanceof List<?> days && days.contains(weekday) && percent < 100) {
                sessions.add(c);
            } else if (Boolean.TRUE.equals(c.get("started")) && percent < 100 && going.size() < 2) {
                going.add(c);
            }
        }
        sessions.sort((a, b) -> String.valueOf(((Map<?, ?>) a.get("plan")).get("time")).compareTo(String.valueOf(((Map<?, ?>) b.get("plan")).get("time"))));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("continue", going);
        out.put("sessions", sessions);
        return out;
    }

    // ── Reminders ─────────────────────────────────────────────────────────────

    @Scheduled(fixedDelay = 15 * 60 * 1000, initialDelay = 3 * 60 * 1000)
    public void scheduled() {
        try {
            run(LocalDateTime.now(clock));
        } catch (Exception e) {
            log.warn("Video study reminders failed: {}", e.getMessage());
        }
    }

    /** Sends the reminders due at `now`; returns how many went out. */
    public int run(LocalDateTime now) {
        int sent = 0;
        if (settings.studyRemindEnabled()) sent += remindPlans(now);
        if (settings.idleRemindDays() > 0 && now.getHour() >= 18 && now.getHour() < 21) sent += remindIdle(now, settings.idleRemindDays());
        return sent;
    }

    private int remindPlans(LocalDateTime now) {
        int sent = 0;
        List<Map<String, Object>> plans = jdbc.queryForList("SELECT p.id, p.learner_id AS learnerId, p.user_id AS userId, p.item_id AS itemId, p.weekdays, " +
                "p.study_time AS studyTime, p.lessons_per_session AS lessonsPerSession, i.title, u.name AS learnerName, (p.learner_id = p.user_id) AS self " +
                "FROM video_study_plans p JOIN items i ON i.id = p.item_id JOIN users u ON u.id = p.learner_id WHERE p.enabled = 1");
        for (Map<String, Object> p : plans) {
            LocalTime time = ((Time) p.get("studyTime")).toLocalTime();
            if (!VideoCourseRules.reminderDue(VideoCourseRules.parseWeekdays((String) p.get("weekdays")), time, now, WINDOW_MINUTES)) continue;
            long learnerId = ((Number) p.get("learnerId")).longValue();
            long itemId = ((Number) p.get("itemId")).longValue();
            Integer today = jdbc.queryForObject("SELECT COUNT(*) FROM item_video_lesson_user_links WHERE learner_id = ? AND item_id = ? AND updated_at >= ?",
                    Integer.class, learnerId, itemId, now.toLocalDate().atStartOfDay());
            if (today != null && today > 0) continue;
            long userId = ((Number) p.get("userId")).longValue();
            if (!claim(learnerId, userId, "video_study", "video-study:" + p.get("id") + ":" + now.toLocalDate())) continue;
            boolean self = VideoCourseAdminService.truthy(p.get("self"));
            int n = ((Number) p.get("lessonsPerSession")).intValue();
            notifications.createNotification(userId, "video_study_reminder",
                    "Đến giờ " + (self ? "tự học" : p.get("learnerName") + " tự học") + ": " + p.get("title"),
                    "Học tiếp " + n + " bài theo lịch bạn đã đặt. Mở là xem tiếp từ chỗ dừng lần trước.",
                    "/learn/" + itemId + "?learner=" + learnerId);
            sent++;
        }
        return sent;
    }

    private int remindIdle(LocalDateTime now, int days) {
        int sent = 0;
        LocalDateTime before = now.minusDays(days);
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT l.learner_id AS learnerId, l.item_id AS itemId, MAX(l.updated_at) AS lastAt, MAX(l.user_id) AS userId, " +
                "i.title, u.name AS learnerName, u.is_child AS isChild, u.user_id AS parentId FROM item_video_lesson_user_links l JOIN items i ON i.id = l.item_id " +
                "JOIN users u ON u.id = l.learner_id GROUP BY l.learner_id, l.item_id, i.title, u.name, u.is_child, u.user_id " +
                "HAVING MAX(l.updated_at) < ? AND MAX(l.updated_at) >= ? LIMIT 500", before, before.minusDays(30));
        for (Map<String, Object> r : rows) {
            long learnerId = ((Number) r.get("learnerId")).longValue();
            long itemId = ((Number) r.get("itemId")).longValue();
            List<VideoLearnService.Lesson> lessons = learn.lessons(itemId);
            Map<String, Object> progress = learn.courseProgress(lessons, learn.progressOf(learnerId, itemId));
            if (((Number) progress.get("percent")).intValue() >= 100) continue;
            boolean child = VideoCourseAdminService.truthy(r.get("isChild"));
            long userId = child && r.get("parentId") instanceof Number pid ? pid.longValue() : learnerId;
            String lastDay = String.valueOf(r.get("lastAt")).substring(0, 10);
            if (!claim(learnerId, userId, "video_idle", "video-idle:" + learnerId + ":" + itemId + ":" + lastDay)) continue;
            notifications.createNotification(userId, "video_idle",
                    (child ? r.get("learnerName") + " đang" : "Bạn đang") + " học dở " + r.get("title"),
                    "Đã " + days + " ngày chưa học tiếp (đang ở " + progress.get("percent") + "%). Mở lại là xem tiếp từ chỗ dừng.",
                    "/learn/" + itemId + "?learner=" + learnerId);
            sent++;
        }
        return sent;
    }

    private boolean claim(long learnerId, long userId, String stage, String key) {
        return jdbc.update("INSERT IGNORE INTO lifecycle_messages (enrollment_id, learner_id, user_id, stage, dedup_key) VALUES (NULL, ?, ?, ?, ?)",
                learnerId, userId, stage, key) > 0;
    }
}
