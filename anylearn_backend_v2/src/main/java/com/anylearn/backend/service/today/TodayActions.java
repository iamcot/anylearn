package com.anylearn.backend.service.today;

import com.anylearn.backend.dto.today.JoinResponse;
import com.anylearn.backend.dto.today.RequestResponse;
import com.anylearn.backend.entity.ItemSchedule;
import com.anylearn.backend.entity.ScheduleRequest;
import com.anylearn.backend.entity.SessionAttendance;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ScheduleRequestRepository;
import com.anylearn.backend.repository.SessionAttendanceRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.anylearn.backend.service.lifecycle.AttendanceRewardService;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class TodayActions {

    private static final Set<String> REQUEST_TYPES = Set.of(
            ScheduleRequest.TYPE_LEAVE, ScheduleRequest.TYPE_RESCHEDULE, ScheduleRequest.TYPE_MAKEUP);
    private static final Map<String, String> REQUEST_NAMES = Map.of(
            ScheduleRequest.TYPE_LEAVE, "xin nghỉ",
            ScheduleRequest.TYPE_RESCHEDULE, "đổi lịch",
            ScheduleRequest.TYPE_MAKEUP, "học bù");

    private final LearnerLoader loader;
    private final SessionSchedule schedule;
    private final SessionAttendanceRepository attendances;
    private final ScheduleRequestRepository requests;
    private final UserRepository users;
    private final NotificationService notifications;
    private final Clock clock;

    /** Optional so the class can be built by hand in tests; gives the full-attendance reward once a session is marked. */
    @Autowired(required = false)
    private AttendanceRewardService rewards;

    private record FoundSession(Learner learner, Session session, EnrollmentContext context) {
    }

    public JoinResponse join(User account, Long learnerId, String sessionKey) {
        FoundSession found = find(account, learnerId, sessionKey);
        LocalDateTime now = LocalDateTime.now(clock);
        ItemSchedule scheduleRow = found.context().schedule();

        requireOnline(found);
        requireJoinWindowOpen(found.session(), now);
        requireMeetingLink(scheduleRow);

        saveAttendance(found, SessionAttendance.SOURCE_JOIN, now);
        return new JoinResponse(scheduleRow.getMeetingUrl(), scheduleRow.getMeetingId(), scheduleRow.getMeetingPasscode());
    }

    public void markAttended(User account, Long learnerId, String sessionKey) {
        FoundSession found = find(account, learnerId, sessionKey);
        LocalDateTime now = LocalDateTime.now(clock);
        if (now.isBefore(found.session().startAt())) {
            throw new IllegalArgumentException("Buổi học chưa bắt đầu");
        }
        saveAttendance(found, SessionAttendance.SOURCE_MANUAL, now);
        if (rewards != null) rewards.checkLearner(found.learner().id());
    }

    public RequestResponse requestChange(User account, Long learnerId, String sessionKey, String type, String note) {
        FoundSession found = find(account, learnerId, sessionKey);
        LocalDateTime now = LocalDateTime.now(clock);
        requireValidRequestType(type);
        if (found.session().hasEndedBy(now)) {
            throw new IllegalArgumentException("Buổi học đã kết thúc");
        }
        requireNoPendingRequest(found);

        ScheduleRequest saved = requests.save(newRequest(account, found, type, note, now));
        notifyAdmins(account, found, type);
        return new RequestResponse(saved.getId(), saved.getStatus());
    }

    private FoundSession find(User account, Long learnerId, String sessionKey) {
        Learner learner = loader.require(account, learnerId);
        SessionKey key = SessionKey.parse(sessionKey);
        DateRange thatDay = DateRange.of(key.date(), key.date());
        return loader.load(learner.id()).contexts().stream()
                .filter(context -> context.hasSchedule() && context.schedule().getId().equals(key.scheduleId()))
                .flatMap(context -> schedule.sessionsIn(context, thatDay).stream()
                        .map(session -> new FoundSession(learner, session, context)))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy buổi học"));
    }

    private void requireOnline(FoundSession found) {
        if (found.context().mode() != SessionMode.ONLINE) {
            throw new IllegalArgumentException("Buổi học này không học online");
        }
    }

    private void requireJoinWindowOpen(Session session, LocalDateTime now) {
        if (!schedule.canJoin(session, now)) {
            throw new IllegalArgumentException("Chưa đến giờ vào lớp");
        }
    }

    private void requireMeetingLink(ItemSchedule scheduleRow) {
        String url = scheduleRow.getMeetingUrl();
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("Lớp chưa có link học, vui lòng liên hệ anyLEARN");
        }
    }

    private void requireValidRequestType(String type) {
        if (type == null || !REQUEST_TYPES.contains(type)) {
            throw new IllegalArgumentException("Loại yêu cầu không hợp lệ");
        }
    }

    private void requireNoPendingRequest(FoundSession found) {
        boolean exists = requests.existsByLearnerIdAndItemScheduleIdAndSessionDateAndStatus(
                found.learner().id(), found.session().scheduleId(), found.session().date(), ScheduleRequest.STATUS_PENDING);
        if (exists) {
            throw new IllegalArgumentException("Bạn đã gửi yêu cầu cho buổi này, anyLEARN sẽ phản hồi sớm");
        }
    }

    private void saveAttendance(FoundSession found, String source, LocalDateTime now) {
        Optional<SessionAttendance> existing = attendances.findByLearnerIdAndItemScheduleIdAndSessionDate(
                found.learner().id(), found.session().scheduleId(), found.session().date());
        SessionAttendance attendance = existing.orElseGet(() -> newAttendance(found, source, now));
        if (SessionAttendance.SOURCE_JOIN.equals(source) && attendance.getJoinedAt() == null) {
            attendance.setJoinedAt(now);
        }
        attendance.setUpdatedAt(now);
        attendances.save(attendance);
    }

    private SessionAttendance newAttendance(FoundSession found, String source, LocalDateTime now) {
        SessionAttendance attendance = new SessionAttendance();
        attendance.setLearnerId(found.learner().id());
        attendance.setItemScheduleId(found.session().scheduleId());
        attendance.setSessionDate(found.session().date());
        attendance.setSource(source);
        attendance.setCreatedAt(now);
        return attendance;
    }

    private ScheduleRequest newRequest(User account, FoundSession found, String type, String note, LocalDateTime now) {
        ScheduleRequest request = new ScheduleRequest();
        request.setLearnerId(found.learner().id());
        request.setAccountId(account.getId());
        request.setEnrollmentId(found.context().enrollment().getId());
        request.setItemScheduleId(found.session().scheduleId());
        request.setSessionDate(found.session().date());
        request.setType(type);
        request.setNote(note != null && note.length() > 500 ? note.substring(0, 500) : note);
        request.setCreatedAt(now);
        request.setUpdatedAt(now);
        return request;
    }

    private void notifyAdmins(User account, FoundSession found, String type) {
        String content = "%s gửi yêu cầu %s cho %s: %s, ngày %02d/%02d".formatted(
                account.getName(), REQUEST_NAMES.get(type), found.learner().name(),
                found.context().item().getTitle(),
                found.session().date().getDayOfMonth(), found.session().date().getMonthValue());
        users.findAdminNotificationRecipients().forEach(admin -> {
            try {
                notifications.createNotification(admin.getId(), "system_notif",
                        "Yêu cầu nghỉ / đổi lịch mới", content, "/admin/schedule-requests", null);
            } catch (Exception e) {
                log.warn("[today] failed to notify admin {}: {}", admin.getId(), e.getMessage());
            }
        });
    }
}
