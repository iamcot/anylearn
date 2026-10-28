package com.anylearn.backend.service.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** The one place that counts what the Anthropic API is used for: every call of {@link AnthropicClient} is a row of `ai_usage_log`. */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiUsageService {

    /** Feature keys written by the callers, and their labels in the back office. */
    public static final String SUGGEST = "suggest";
    public static final String COMPARE = "compare";
    public static final String QUIZ_WRITE = "quiz_write";
    public static final String QUIZ_VERIFY = "quiz_verify";
    public static final Map<String, String> LABELS = Map.of(
            SUGGEST, "Gợi ý khóa học AI",
            COMPARE, "So sánh khóa học (đọc mô tả)",
            QUIZ_WRITE, "Quiz: AI viết câu hỏi",
            QUIZ_VERIFY, "Quiz: AI chấm đáp án");

    private final JdbcTemplate jdbc;

    /** Never throws: a failed write must not break the feature that made the call. */
    public void record(String feature, String model, int inputTokens, int outputTokens, long durationMs, String error) {
        try {
            jdbc.update("INSERT INTO ai_usage_log (feature, model, input_tokens, output_tokens, duration_ms, ok, error) VALUES (?,?,?,?,?,?,?)",
                    feature, model, inputTokens, outputTokens, (int) Math.min(durationMs, Integer.MAX_VALUE), error == null ? 1 : 0,
                    error == null ? null : error.substring(0, Math.min(error.length(), 200)));
        } catch (RuntimeException e) {
            log.warn("Could not write the AI usage log: {}", e.getMessage());
        }
    }

    /** Totals, per feature, per model and per day for the last `days` days (today included). */
    public Map<String, Object> report(int days) {
        int d = Math.max(1, Math.min(days, 365));
        LocalDate from = LocalDate.now().minusDays(d - 1L);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("days", d);
        out.put("from", from.toString());
        String cols = "COUNT(*) AS calls, COALESCE(SUM(ok = 0),0) AS errors, COALESCE(SUM(input_tokens),0) AS input_tokens, "
                + "COALESCE(SUM(output_tokens),0) AS output_tokens, COALESCE(AVG(duration_ms),0) AS avg_ms";
        out.put("totals", row(jdbc.queryForMap("SELECT " + cols + " FROM ai_usage_log WHERE created_at >= ?", from)));
        List<Map<String, Object>> features = jdbc.queryForList("SELECT feature, " + cols + " FROM ai_usage_log WHERE created_at >= ? GROUP BY feature ORDER BY SUM(input_tokens + output_tokens) DESC", from)
                .stream().map(r -> {
                    Map<String, Object> m = row(r);
                    m.put("feature", r.get("feature"));
                    m.put("label", LABELS.getOrDefault(String.valueOf(r.get("feature")), String.valueOf(r.get("feature"))));
                    return m;
                }).toList();
        out.put("features", features);
        out.put("models", jdbc.queryForList("SELECT model, " + cols + " FROM ai_usage_log WHERE created_at >= ? GROUP BY model ORDER BY SUM(input_tokens + output_tokens) DESC", from)
                .stream().map(r -> {
                    Map<String, Object> m = row(r);
                    m.put("model", r.get("model"));
                    return m;
                }).toList());
        out.put("daily", jdbc.queryForList("SELECT DATE(created_at) AS day, feature, COALESCE(SUM(input_tokens),0) AS input_tokens, COALESCE(SUM(output_tokens),0) AS output_tokens, COUNT(*) AS calls "
                + "FROM ai_usage_log WHERE created_at >= ? GROUP BY DATE(created_at), feature ORDER BY day", from)
                .stream().map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("day", String.valueOf(r.get("day")));
                    m.put("feature", r.get("feature"));
                    m.put("inputTokens", num(r.get("input_tokens")));
                    m.put("outputTokens", num(r.get("output_tokens")));
                    m.put("calls", num(r.get("calls")));
                    return m;
                }).toList());
        out.put("recentErrors", jdbc.queryForList("SELECT feature, model, error, created_at FROM ai_usage_log WHERE ok = 0 ORDER BY id DESC LIMIT 10"));
        return out;
    }

    private static Map<String, Object> row(Map<String, Object> r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("calls", num(r.get("calls")));
        m.put("errors", num(r.get("errors")));
        m.put("inputTokens", num(r.get("input_tokens")));
        m.put("outputTokens", num(r.get("output_tokens")));
        m.put("avgMs", Math.round(((Number) r.get("avg_ms")).doubleValue()));
        return m;
    }

    private static long num(Object o) {
        return o == null ? 0 : ((Number) o).longValue();
    }
}
