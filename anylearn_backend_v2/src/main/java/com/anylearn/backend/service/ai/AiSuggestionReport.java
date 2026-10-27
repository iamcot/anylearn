package com.anylearn.backend.service.ai;

import com.anylearn.backend.service.recommend.RecommendationRules;
import com.anylearn.backend.service.recommend.RecommendationSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Back office numbers of the AI suggestions: usage, tokens, clicks, orders and the parents' feedback. */
@Service
@RequiredArgsConstructor
public class AiSuggestionReport {

    private final JdbcTemplate jdbc;
    private final AnthropicClient anthropic;
    private final RecommendationSettings settings;

    public Map<String, Object> summary(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", settings.aiEnabled());
        out.put("configured", anthropic.isConfigured());
        out.put("model", anthropic.model());

        Map<String, Object> usage = jdbc.queryForMap("""
                SELECT COUNT(*) AS suggestions, COALESCE(SUM(status <> 'ai'),0) AS fallbacks, COUNT(DISTINCT learner_id) AS learners, COALESCE(SUM(input_tokens),0) AS input_tokens,
                       COALESCE(SUM(output_tokens),0) AS output_tokens, COALESCE(AVG(candidates),0) AS avg_candidates
                FROM ai_suggestions WHERE day >= ? AND day <= ?""", from, to);
        out.put("suggestions", number(usage.get("suggestions")));
        out.put("fallbacks", number(usage.get("fallbacks")));
        out.put("learners", number(usage.get("learners")));
        out.put("inputTokens", number(usage.get("input_tokens")));
        out.put("outputTokens", number(usage.get("output_tokens")));

        // A list opened = one learner on one day with a shown course; "lượt xem khóa" = a course opened from the list.
        long listsOpened = count("SELECT COUNT(DISTINCT learner_id, DATE(created_at)) FROM recommendation_events WHERE source = ? AND event = 'view' AND created_at >= ? AND created_at < ?", start, end);
        long listsClicked = count("SELECT COUNT(DISTINCT learner_id, DATE(created_at)) FROM recommendation_events WHERE source = ? AND event = 'click' AND created_at >= ? AND created_at < ?", start, end);
        long clicks = count("SELECT COUNT(*) FROM recommendation_events WHERE source = ? AND event = 'click' AND created_at >= ? AND created_at < ?", start, end);
        long orders = count("""
                SELECT COUNT(DISTINCT e.learner_id, e.item_id) FROM recommendation_events e
                JOIN order_details od ON od.item_id = e.item_id AND od.user_id = e.learner_id AND od.created_at >= e.created_at
                  AND od.created_at < DATE_ADD(e.created_at, INTERVAL 30 DAY) AND od.status NOT LIKE 'cancel%'
                WHERE e.source = ? AND e.event = 'click' AND e.created_at >= ? AND e.created_at < ?""", start, end);
        out.put("listsOpened", listsOpened);
        out.put("clicks", clicks);
        out.put("clickRate", listsOpened == 0 ? 0 : Math.min(100, Math.round(listsClicked * 1000.0 / listsOpened) / 10.0));
        out.put("orders", orders);

        Map<String, Object> feedback = jdbc.queryForMap("""
                SELECT COALESCE(SUM(rating > 0),0) AS up, COALESCE(SUM(rating < 0),0) AS down FROM ai_suggestion_feedback
                WHERE created_at >= ? AND created_at < ?""", start, end);
        out.put("thumbsUp", number(feedback.get("up")));
        out.put("thumbsDown", number(feedback.get("down")));

        Map<String, Long> reasons = new LinkedHashMap<>();
        jdbc.queryForList("SELECT reasons FROM ai_suggestion_feedback WHERE rating < 0 AND reasons IS NOT NULL AND created_at >= ? AND created_at < ?",
                String.class, start, end).forEach(csv -> {
            for (String key : csv.split(",")) reasons.merge(key, 1L, Long::sum);
        });
        List<Map<String, Object>> reasonRows = new ArrayList<>();
        reasons.entrySet().stream().sorted(Map.Entry.<String, Long>comparingByValue().reversed()).forEach(e -> reasonRows.add(Map.of(
                "key", e.getKey(), "label", AiSuggestionRules.DOWN_REASONS.getOrDefault(e.getKey(), e.getKey()), "count", e.getValue())));
        out.put("downReasons", reasonRows);

        out.put("daily", jdbc.queryForList("SELECT day, COUNT(*) AS suggestions, COALESCE(SUM(input_tokens + output_tokens),0) AS tokens FROM ai_suggestions WHERE day >= ? AND day <= ? GROUP BY day ORDER BY day",
                from, to));
        return out;
    }

    /** Latest feedback with who it was for and what was suggested. */
    public List<Map<String, Object>> feedbackList(int limit) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT f.id, f.rating, f.reasons, f.comment, f.created_at, f.learner_id, u.name AS learner_name, s.day, s.items_json
                FROM ai_suggestion_feedback f JOIN ai_suggestions s ON s.id = f.suggestion_id LEFT JOIN users u ON u.id = f.learner_id
                ORDER BY f.id DESC LIMIT ?""", limit);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", row.get("id"));
            map.put("rating", row.get("rating"));
            map.put("reasons", AiSuggestionRules.reasonLabels((String) row.get("reasons")));
            map.put("comment", row.get("comment"));
            map.put("createdAt", String.valueOf(row.get("created_at")));
            map.put("learnerName", row.get("learner_name"));
            map.put("day", String.valueOf(row.get("day")));
            out.add(map);
        }
        return out;
    }

    private long count(String sql, LocalDateTime start, LocalDateTime end) {
        Long n = jdbc.queryForObject(sql, Long.class, RecommendationRules.AI, start, end);
        return n == null ? 0 : n;
    }

    private static long number(Object value) {
        return value instanceof Number n ? n.longValue() : 0;
    }
}
