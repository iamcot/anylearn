package com.anylearn.backend.service.lifecycle;

import com.anylearn.backend.entity.Transaction;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.SessionAttendanceRepository;
import com.anylearn.backend.repository.TransactionRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.WalletService;
import com.anylearn.backend.service.today.EnrollmentContext;
import com.anylearn.backend.service.today.LearnerLoader;
import com.anylearn.backend.service.today.Session;
import com.anylearn.backend.service.today.SessionSchedule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * anyPoint for a learner who attended every session of a course (setting `lifecycle/full_attendance_points`, 0 = off).
 * Checked by the hourly scan and right after an attendance is saved; once per enrollment (`lifecycle_messages`, key
 * `full-attendance:{enrollmentId}`). The points go to the account owner. An approved leave is not an attendance.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceRewardService {

    public static final String TYPE_REWARD = "attendance_reward";

    private final JdbcTemplate jdbc;
    private final LifecycleSettings settings;
    private final LearnerLoader learnerLoader;
    private final SessionSchedule sessionSchedule;
    private final SessionAttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final WalletService walletService;
    private final NotificationService notificationService;
    private final Clock clock;

    /** Checks every course of a learner (after an attendance was saved). Never throws: a failed reward must not undo the attendance. */
    public void checkLearner(Long learnerId) {
        try {
            if (settings.fullAttendancePoints() <= 0) return;
            User learner = userRepository.findById(learnerId).orElse(null);
            if (learner == null) return;
            LocalDateTime now = LocalDateTime.now(clock);
            for (EnrollmentContext context : learnerLoader.load(learnerId).contexts()) {
                if (context.hasSchedule() && !context.isFee()) check(learner, context, now);
            }
        } catch (Exception e) {
            log.warn("Attendance reward: learner {} failed: {}", learnerId, e.getMessage());
        }
    }

    /** Gives the reward when the course is over and every session of it was attended. Returns the points given. */
    @Transactional
    public int check(User learner, EnrollmentContext context, LocalDateTime now) {
        int points = settings.fullAttendancePoints();
        if (points <= 0) return 0;
        List<Session> sessions = sessionSchedule.wholePeriod(context);
        int total = context.purchasedSessions() != null ? context.purchasedSessions() : sessions.size();
        List<Session> ended = sessions.stream().filter(session -> session.hasEndedBy(now))
                .sorted(Comparator.comparing(Session::startAt)).toList();
        Long scheduleId = context.schedule().getId();
        List<Boolean> attended = new ArrayList<>();
        for (Session session : ended) {
            attended.add(attendanceRepository.findByLearnerIdAndItemScheduleIdAndSessionDate(learner.getId(), scheduleId, session.date()).isPresent());
        }
        if (!LifecycleRules.fullAttendance(attended, total)) return 0;

        Long enrollmentId = context.enrollment().getId();
        Long accountId = accountIdOf(learner);
        int rows = jdbc.update(
                "INSERT IGNORE INTO lifecycle_messages (enrollment_id, learner_id, user_id, stage, dedup_key) VALUES (?, ?, ?, 'full_attendance', ?)",
                enrollmentId, learner.getId(), accountId, "full-attendance:" + enrollmentId);
        if (rows != 1) return 0;

        String who = Byte.valueOf((byte) 1).equals(learner.getIsChild()) ? learner.getName() : "Bạn";
        String itemTitle = context.item().getTitle();
        Transaction tx = new Transaction();
        tx.setUserId(accountId);
        tx.setType(TYPE_REWARD);
        tx.setAmount((long) points);
        tx.setPayMethod("wallet_c");
        tx.setContent("Thưởng điểm danh đủ: " + who + ", " + itemTitle);
        tx.setStatus(1);
        tx.setCreatedAt(LocalDateTime.now());
        tx.setUpdatedAt(LocalDateTime.now());
        transactionRepository.save(tx);
        walletService.creditWalletC(accountId, points);
        try {
            notificationService.createNotification(accountId, "system_notif", "Nhận " + points + " anyPoint",
                    who + " đã điểm danh đủ các buổi của " + itemTitle + ", anyLEARN tặng " + points + " anyPoint.", "/account/anypoint", null);
        } catch (Exception e) {
            log.warn("Attendance reward: notification to {} failed: {}", accountId, e.getMessage());
        }
        return points;
    }

    private static Long accountIdOf(User learner) {
        boolean isChild = Byte.valueOf((byte) 1).equals(learner.getIsChild()) && learner.getUserId() != null;
        return isChild ? learner.getUserId() : learner.getId();
    }
}
