package com.anylearn.backend.service.reviews;

import com.anylearn.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.Clock;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Reminds a parent to review a course they paid for (plan 09.5): once when half of the course has passed and once
 * when it is over, never if they already wrote a review. Each step is a row of `review_reminders` (unique), so it goes out once.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewReminderService {

    static final int MAX_PER_RUN = 300;

    private final JdbcTemplate jdbc;
    private final NotificationService notificationService;
    private final ReviewSettings settings;
    private final Clock clock;

    @Scheduled(fixedDelay = 60 * 60 * 1000, initialDelay = 5 * 60 * 1000)
    public void run() {
        if (!settings.remindEnabled()) return;
        LocalDate today = LocalDate.now(clock);
        int sent = 0;
        for (Map<String, Object> enrollment : candidates(today)) {
            if (sent >= MAX_PER_RUN) break;
            try {
                if (remind(enrollment, today)) sent++;
            } catch (Exception e) {
                log.warn("[reviewReminder] enrollment {} skipped: {}", enrollment.get("id"), e.getMessage());
            }
        }
        if (sent > 0) log.info("[reviewReminder] sent {} reminders", sent);
    }

    /** Paid enrollments of courses not reviewed yet by the person, and not over for longer than the window. */
    private List<Map<String, Object>> candidates(LocalDate today) {
        return jdbc.queryForList("""
                SELECT e.id, e.user_id, e.item_id, e.start_date, e.end_date, i.title AS item_title, o.user_id AS buyer_id
                FROM user_course_enrollments e
                JOIN items i ON i.id = e.item_id
                JOIN orders o ON o.id = e.order_id AND o.status = 'delivered'
                WHERE e.status IN ('active', 'completed') AND e.start_date IS NOT NULL
                  AND COALESCE(e.end_date, DATE_ADD(e.start_date, INTERVAL ? DAY)) >= ?
                  AND e.start_date <= ?
                ORDER BY e.id
                """, ReviewReminderRules.OPEN_COURSE_DAYS, Date.valueOf(today.minusDays(ReviewReminderRules.WINDOW_DAYS)), Date.valueOf(today));
    }

    private boolean remind(Map<String, Object> enrollment, LocalDate today) {
        Long parentId = ((Number) enrollment.get("buyer_id")).longValue();
        Long itemId = ((Number) enrollment.get("item_id")).longValue();
        if (alreadyReviewed(parentId, itemId)) return false;

        Set<String> sent = new HashSet<>(jdbc.queryForList(
                "SELECT stage FROM review_reminders WHERE user_id = ? AND item_id = ?", String.class, parentId, itemId));
        LocalDate start = ((Date) enrollment.get("start_date")).toLocalDate();
        LocalDate end = enrollment.get("end_date") == null ? null : ((Date) enrollment.get("end_date")).toLocalDate();
        String stage = ReviewReminderRules.dueStage(start, end, today, sent).orElse(null);
        if (stage == null) return false;
        if (jdbc.update("INSERT IGNORE INTO review_reminders (user_id, item_id, stage) VALUES (?, ?, ?)", parentId, itemId, stage) == 0) return false;

        String title = String.valueOf(enrollment.get("item_title"));
        notificationService.createNotification(parentId, "review_reminder", ReviewReminderRules.title(stage),
                ReviewReminderRules.content(stage, title, settings.pointsForText()), "/pdp", String.valueOf(itemId));
        return true;
    }

    private boolean alreadyReviewed(Long userId, Long itemId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM item_user_actions WHERE user_id = ? AND item_id = ? AND type = 'rating'", Integer.class, userId, itemId);
        return count != null && count > 0;
    }
}
