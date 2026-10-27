package com.anylearn.backend.service.itemview;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Course page opens per person, kept small on purpose: one row per person, course and day (`item_view_days`, a counter
 * instead of one row per open), and rows older than {@link #KEEP_DAYS} days are deleted every night. The AI suggestions read
 * the last few courses a person looked at. Anonymous visitors are not recorded here (they are in `item_events`).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ItemViewService {

    public static final int KEEP_DAYS = 60;

    private final JdbcTemplate jdbc;
    private final Clock clock;

    /** Counts one open of the course page by this person today. Unknown courses are ignored. */
    public void record(Long userId, Long itemId) {
        if (userId == null || itemId == null) return;
        LocalDateTime now = LocalDateTime.now(clock);
        jdbc.update("""
                INSERT INTO item_view_days (user_id, item_id, day, views, last_viewed_at)
                SELECT ?, i.id, ?, 1, ? FROM items i WHERE i.id = ?
                ON DUPLICATE KEY UPDATE views = views + 1, last_viewed_at = VALUES(last_viewed_at)""",
                userId, Date.valueOf(now.toLocalDate()), java.sql.Timestamp.valueOf(now), itemId);
    }

    /** Titles of the courses the person opened in the last `days` days, the latest first, each once. */
    public List<String> recentTitles(Long userId, int days, int limit) {
        return jdbc.queryForList("""
                SELECT i.title FROM item_view_days v JOIN items i ON i.id = v.item_id
                WHERE v.user_id = ? AND v.day >= ?
                GROUP BY i.id, i.title ORDER BY MAX(v.last_viewed_at) DESC LIMIT ?""",
                String.class, userId, Date.valueOf(LocalDate.now(clock).minusDays(days)), limit);
    }

    @Scheduled(cron = "0 30 3 * * *")
    public void prune() {
        try {
            int deleted = jdbc.update("DELETE FROM item_view_days WHERE day < ?", Date.valueOf(LocalDate.now(clock).minusDays(KEEP_DAYS)));
            if (deleted > 0) log.info("[item-views] deleted {} rows older than {} days", deleted, KEEP_DAYS);
        } catch (Exception e) {
            log.error("[item-views] prune failed: {}", e.getMessage(), e);
        }
    }
}
