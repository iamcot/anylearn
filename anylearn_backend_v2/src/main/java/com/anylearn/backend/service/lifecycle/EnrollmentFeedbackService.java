package com.anylearn.backend.service.lifecycle;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/** The one-question survey in the middle of a course (plan 07.4): which surveys wait for a person, and saving an answer. */
@Service
@RequiredArgsConstructor
public class EnrollmentFeedbackService {

    private static final int SURVEY_VISIBLE_DAYS = 30;

    private final JdbcTemplate jdbc;
    private final LifecycleSettings settings;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /** Surveys that were sent to this account in the last 30 days and are not answered yet. */
    public List<Map<String, Object>> pending(User account) {
        return jdbc.queryForList("""
                SELECT m.enrollment_id AS enrollmentId, m.learner_id AS learnerId, l.name AS learnerName,
                       e.item_id AS itemId, i.title AS itemTitle
                FROM lifecycle_messages m
                JOIN user_course_enrollments e ON e.id = m.enrollment_id
                JOIN items i ON i.id = e.item_id
                JOIN users l ON l.id = m.learner_id
                WHERE m.user_id = ? AND m.stage = 'survey'
                  AND m.created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
                  AND NOT EXISTS (SELECT 1 FROM enrollment_feedback f WHERE f.enrollment_id = m.enrollment_id AND f.stage = 'mid')
                ORDER BY m.created_at DESC""", account.getId(), SURVEY_VISIBLE_DAYS);
    }

    /** Saves the answer (once per enrollment). A low score also tells the back office team. */
    public Map<String, Object> answer(User account, Long enrollmentId, Integer score, String note) {
        if (!LifecycleRules.validScore(score)) {
            throw new IllegalArgumentException("Điểm phải từ " + LifecycleRules.MIN_SCORE + " đến " + LifecycleRules.MAX_SCORE);
        }
        List<Map<String, Object>> sent = jdbc.queryForList(
                "SELECT learner_id FROM lifecycle_messages WHERE enrollment_id = ? AND user_id = ? AND stage = 'survey'",
                enrollmentId, account.getId());
        if (sent.isEmpty()) throw new IllegalArgumentException("Không tìm thấy khảo sát này");
        Long learnerId = ((Number) sent.get(0).get("learner_id")).longValue();
        String cleanNote = note == null || note.isBlank() ? null : note.trim();
        int rows = jdbc.update(
                "INSERT IGNORE INTO enrollment_feedback (enrollment_id, learner_id, user_id, stage, score, note) VALUES (?, ?, ?, 'mid', ?, ?)",
                enrollmentId, learnerId, account.getId(), score, cleanNote);
        boolean low = LifecycleRules.isLow(score, settings.surveyLowScore());
        if (rows == 1 && low) alertTeam(enrollmentId, learnerId, score, cleanNote);
        return Map.of("saved", rows == 1, "low", low);
    }

    private void alertTeam(Long enrollmentId, Long learnerId, int score, String note) {
        String itemTitle = jdbc.queryForList("SELECT i.title FROM user_course_enrollments e JOIN items i ON i.id = e.item_id WHERE e.id = ?",
                String.class, enrollmentId).stream().findFirst().orElse("");
        String learner = userRepository.findById(learnerId).map(User::getName).orElse("id " + learnerId);
        String content = "%s chấm %d/5 giữa khóa %s%s. Nên gọi hỏi thăm phụ huynh.".formatted(learner, score, itemTitle,
                note == null ? "" : ": \"" + note + "\"");
        userRepository.findAdminNotificationRecipients().forEach(admin ->
                notificationService.createNotification(admin.getId(), "system_notif", "Khảo sát giữa khóa điểm thấp", content, "/admin/dashboard", null));
    }
}
