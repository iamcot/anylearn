package com.anylearn.backend.service.reviews;

import com.anylearn.backend.service.ConfigService;
import com.anylearn.backend.service.search.ItemVisibility;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Courses with the best published reviews written in the last N days (N is a back office setting), best average first. */
@Service
@RequiredArgsConstructor
public class TopRatedService {

    private final JdbcTemplate jdbc;
    private final ReviewSettings settings;
    private final ConfigService configService;

    public Map<String, Object> topRated(int limit) {
        int days = settings.topRatedDays();
        List<Long> ids = jdbc.queryForList("""
                SELECT i.id FROM item_user_actions r
                JOIN items i ON i.id = r.item_id
                LEFT JOIN review_details d ON d.review_id = r.id
                WHERE r.type = 'rating' AND r.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                  AND COALESCE(d.status, 'published') = 'published' AND i.is_test = 0 AND %s
                GROUP BY i.id
                ORDER BY AVG(r.value + 0) DESC, COUNT(*) DESC, MAX(i.popularity_score) DESC, i.id
                LIMIT ?""".formatted(ItemVisibility.VISIBLE_ITEM_SQL), Long.class, days, Math.min(Math.max(limit, 1), 50));
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("title", TopRatedRules.title(days));
        response.put("days", days);
        response.put("items", configService.getItemsByIds(ids));
        return response;
    }
}
