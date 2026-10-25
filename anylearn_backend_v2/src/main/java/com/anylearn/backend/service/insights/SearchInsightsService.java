package com.anylearn.backend.service.insights;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** What visitors look for and cannot find, for the team that looks for partners (back office "Xu hướng nhu cầu"). */
@Service
@RequiredArgsConstructor
public class SearchInsightsService {

    static final int DEFAULT_DAYS = 30;
    static final int MAX_DAYS = 365;
    private static final int TOP = 20;

    private final EntityManager em;

    static int clampDays(Integer days) {
        if (days == null || days < 1) return DEFAULT_DAYS;
        return Math.min(days, MAX_DAYS);
    }

    public Map<String, Object> report(Integer requestedDays) {
        int days = clampDays(requestedDays);
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("days", days);
        report.put("summary", summary(since));
        report.put("topKeywords", keywords(since, false));
        report.put("noResultKeywords", keywords(since, true));
        report.put("demand", demand(since));
        report.put("requestsByStatus", requestsByStatus(since));
        report.put("requestSubjects", requestSubjects(since));
        report.put("categoryFunnel", categoryFunnel(since));
        return report;
    }

    private Map<String, Object> summary(LocalDateTime since) {
        Object[] row = (Object[]) query("""
                SELECT COUNT(*), COALESCE(SUM(keyword_normalized IS NOT NULL), 0), COALESCE(SUM(result_count = 0), 0),
                       COALESCE(SUM(clicked_item_id IS NOT NULL), 0), COUNT(DISTINCT session_key)
                FROM search_logs WHERE created_at >= :since
                """, since).get(0);
        return toMap(row, "searches", "withKeyword", "noResult", "clicked", "visitors");
    }

    private List<Map<String, Object>> keywords(LocalDateTime since, boolean onlyNoResult) {
        return rows("""
                SELECT MAX(keyword), COUNT(*), SUM(result_count = 0), SUM(clicked_item_id IS NOT NULL)
                FROM search_logs
                WHERE created_at >= :since AND keyword_normalized IS NOT NULL %s
                GROUP BY keyword_normalized ORDER BY COUNT(*) DESC, MAX(created_at) DESC LIMIT %d
                """.formatted(onlyNoResult ? "AND result_count = 0" : "", TOP),
                since, "keyword", "searches", "noResult", "clicked");
    }

    // Age × area × field of the searches that used a filter: where to look for partners.
    private List<Map<String, Object>> demand(LocalDateTime since) {
        return rows("""
                SELECT age_filter, location_filter, category, COUNT(*), SUM(result_count = 0)
                FROM search_logs
                WHERE created_at >= :since AND (age_filter IS NOT NULL OR location_filter IS NOT NULL OR category IS NOT NULL)
                GROUP BY age_filter, location_filter, category ORDER BY COUNT(*) DESC LIMIT 30
                """, since, "age", "location", "category", "searches", "noResult");
    }

    private List<Map<String, Object>> requestsByStatus(LocalDateTime since) {
        return rows("SELECT status, COUNT(*) FROM course_requests WHERE created_at >= :since GROUP BY status",
                since, "status", "requests");
    }

    private List<Map<String, Object>> requestSubjects(LocalDateTime since) {
        return rows("""
                SELECT MAX(subject), COUNT(*), SUM(status = 'matched'), SUM(status = 'no_partner')
                FROM course_requests WHERE created_at >= :since
                GROUP BY subject_normalized ORDER BY COUNT(*) DESC LIMIT %d
                """.formatted(TOP), since, "subject", "requests", "matched", "noPartner");
    }

    // Fields people open a lot but rarely buy from.
    private List<Map<String, Object>> categoryFunnel(LocalDateTime since) {
        return rows("""
                SELECT c.title, v.views, COALESCE(o.orders, 0)
                FROM categories c
                JOIN (SELECT ic.category_id, COUNT(*) AS views FROM item_events e
                      JOIN items_categories ic ON ic.item_id = e.item_id
                      WHERE e.type = 'view' AND e.created_at >= :since GROUP BY ic.category_id) v ON v.category_id = c.id
                LEFT JOIN (SELECT ic.category_id, COUNT(*) AS orders FROM order_details d
                           JOIN items_categories ic ON ic.item_id = d.item_id
                           WHERE d.status = 'delivered' AND d.created_at >= :since GROUP BY ic.category_id) o ON o.category_id = c.id
                ORDER BY v.views DESC LIMIT %d
                """.formatted(TOP), since, "category", "views", "orders");
    }

    @SuppressWarnings("unchecked")
    private List<Object> query(String sql, LocalDateTime since) {
        return em.createNativeQuery(sql).setParameter("since", since).getResultList();
    }

    private List<Map<String, Object>> rows(String sql, LocalDateTime since, String... keys) {
        return query(sql, since).stream().map(row -> toMap((Object[]) row, keys)).toList();
    }

    static Map<String, Object> toMap(Object[] row, String... keys) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < keys.length; i++) {
            Object value = row[i];
            map.put(keys[i], value instanceof Number number && !(value instanceof Double) ? (Object) number.longValue() : value);
        }
        return map;
    }
}
