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
                + "COALESCE(SUM(output_tokens),0) AS output_tokens, COALESCE(SUM(duration_ms),0) AS total_ms";
        // One query by feature and model, so the cost of each slice uses the price of its own model.
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT feature, model, " + cols + " FROM ai_usage_log WHERE created_at >= ? GROUP BY feature, model", from);
        Map<String, long[]> byFeature = new LinkedHashMap<>();
        Map<String, double[]> featureCost = new LinkedHashMap<>();
        Map<String, long[]> byModel = new LinkedHashMap<>();
        Map<String, double[]> modelCost = new LinkedHashMap<>();
        long[] total = new long[5];
        double[] totalCost = new double[1];
        boolean[] unpriced = new boolean[1];
        for (Map<String, Object> r : rows) {
            String feature = String.valueOf(r.get("feature"));
            String model = String.valueOf(r.get("model"));
            long[] v = {num(r.get("calls")), num(r.get("errors")), num(r.get("input_tokens")), num(r.get("output_tokens")), num(r.get("total_ms"))};
            double cost = AiPricing.cost(model, v[2], v[3]);
            if (!AiPricing.known(model) && v[2] + v[3] > 0) unpriced[0] = true;
            add(byFeature, feature, v); addCost(featureCost, feature, cost);
            add(byModel, model, v); addCost(modelCost, model, cost);
            for (int i = 0; i < 5; i++) total[i] += v[i];
            totalCost[0] += cost;
        }
        out.put("totals", row(total, totalCost[0]));
        List<Map<String, Object>> features = byFeature.entrySet().stream()
                .sorted((x, y) -> Long.compare(y.getValue()[2] + y.getValue()[3], x.getValue()[2] + x.getValue()[3]))
                .map(e -> {
                    Map<String, Object> m = row(e.getValue(), featureCost.get(e.getKey())[0]);
                    m.put("feature", e.getKey());
                    m.put("label", LABELS.getOrDefault(e.getKey(), e.getKey()));
                    return m;
                }).toList();
        out.put("features", features);
        out.put("models", byModel.entrySet().stream()
                .sorted((x, y) -> Long.compare(y.getValue()[2] + y.getValue()[3], x.getValue()[2] + x.getValue()[3]))
                .map(e -> {
                    Map<String, Object> m = row(e.getValue(), modelCost.get(e.getKey())[0]);
                    m.put("model", e.getKey());
                    double[] p = AiPricing.prices(e.getKey());
                    m.put("priceInput", p == null ? null : p[0]);
                    m.put("priceOutput", p == null ? null : p[1]);
                    return m;
                }).toList());
        out.put("hasUnpriced", unpriced[0]);
        // per day and feature; cost is summed per model inside the day
        Map<String, Map<String, Object>> daily = new LinkedHashMap<>();
        for (Map<String, Object> r : jdbc.queryForList("SELECT DATE(created_at) AS day, feature, model, COALESCE(SUM(input_tokens),0) AS input_tokens, COALESCE(SUM(output_tokens),0) AS output_tokens, COUNT(*) AS calls "
                + "FROM ai_usage_log WHERE created_at >= ? GROUP BY DATE(created_at), feature, model ORDER BY day", from)) {
            String day = String.valueOf(r.get("day"));
            String feature = String.valueOf(r.get("feature"));
            Map<String, Object> m = daily.computeIfAbsent(day + "|" + feature, k -> {
                Map<String, Object> n = new LinkedHashMap<>();
                n.put("day", day); n.put("feature", feature);
                n.put("inputTokens", 0L); n.put("outputTokens", 0L); n.put("calls", 0L); n.put("costUsd", 0.0);
                return n;
            });
            long in = num(r.get("input_tokens")), outT = num(r.get("output_tokens"));
            m.put("inputTokens", (Long) m.get("inputTokens") + in);
            m.put("outputTokens", (Long) m.get("outputTokens") + outT);
            m.put("calls", (Long) m.get("calls") + num(r.get("calls")));
            m.put("costUsd", (Double) m.get("costUsd") + AiPricing.cost(String.valueOf(r.get("model")), in, outT));
        }
        out.put("daily", List.copyOf(daily.values()));
        out.put("recentErrors", jdbc.queryForList("SELECT feature, model, error, created_at FROM ai_usage_log WHERE ok = 0 ORDER BY id DESC LIMIT 10"));
        return out;
    }

    private static void add(Map<String, long[]> map, String key, long[] v) {
        long[] t = map.computeIfAbsent(key, k -> new long[5]);
        for (int i = 0; i < 5; i++) t[i] += v[i];
    }

    private static void addCost(Map<String, double[]> map, String key, double cost) {
        map.computeIfAbsent(key, k -> new double[1])[0] += cost;
    }

    /** v = calls, errors, input tokens, output tokens, total milliseconds. */
    private static Map<String, Object> row(long[] v, double costUsd) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("calls", v[0]);
        m.put("errors", v[1]);
        m.put("inputTokens", v[2]);
        m.put("outputTokens", v[3]);
        m.put("avgMs", v[0] == 0 ? 0 : Math.round((double) v[4] / v[0]));
        m.put("costUsd", Math.round(costUsd * 1_000_000d) / 1_000_000d);
        return m;
    }

    private static long num(Object o) {
        return o == null ? 0 : ((Number) o).longValue();
    }
}
