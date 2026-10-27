package com.anylearn.backend.service.ai;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.service.recommend.RecommendationRules.Candidate;
import com.anylearn.backend.service.recommend.RecommendationService;
import com.anylearn.backend.service.recommend.RecommendationService.Pool;
import com.anylearn.backend.service.recommend.RecommendationSettings;
import com.anylearn.backend.service.today.LearnerLoader;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Daily course suggestions by AI. The rule engine ({@link RecommendationService#pool}) narrows the catalogue to a shortlist
 * (age, schedule, already bought, hidden); the AI only sees one compact line per course plus the learner profile and
 * returns ranked ids with reasons. The answer is saved per learner per day, so a learner costs one AI call a day.
 * Switched off, not configured or failing: the rule ranking is returned instead and nothing is saved.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiSuggestionService {

    private static final int SUMMARY_CHARS = 90;
    private static final int MAX_PER_PARTNER = 4;
    private static final Map<String, String> BUDGET_WORDS = Map.of(
            "lt500", "dưới 500.000đ", "500_1000", "500.000đ đến 1 triệu", "1000_2000", "1 đến 2 triệu", "gt2000", "trên 2 triệu");
    private static final ObjectMapper JSON = new ObjectMapper();

    private final JdbcTemplate jdbc;
    private final AnthropicClient anthropic;
    private final RecommendationService recommendations;
    private final RecommendationSettings settings;
    private final ItemRepository itemRepository;
    private final LearnerLoader learnerLoader;
    private final Clock clock;

    private final Map<Long, Object> locks = new ConcurrentHashMap<>();

    /** Whether the AI will really be asked (switch on in the back office and a key on the server). */
    public boolean isActive() {
        return settings.aiEnabled() && anthropic.isConfigured();
    }

    /** Today's answer for the learner: from the saved one, else asked now. `ai` is false when the rules answered instead. */
    public Map<String, Object> suggest(User account, Long learnerId) {
        learnerLoader.require(account, learnerId);
        LocalDate today = LocalDate.now(clock);
        Object lock = locks.computeIfAbsent(learnerId, id -> new Object());
        synchronized (lock) {
            Map<String, Object> saved = savedFor(learnerId, today);
            if (saved != null) return answer(account, learnerId, saved);
            Pool pool = recommendations.pool(account, learnerId, settings.aiCandidates());
            int results = settings.aiResults();
            Map<Long, String> ruleReasons = new LinkedHashMap<>();
            pool.candidates().forEach(c -> ruleReasons.put(c.itemId(), c.reasonText()));
            List<Long> ranked = new ArrayList<>(ruleReasons.keySet());

            if (isActive() && !pool.candidates().isEmpty()) {
                try {
                    return askAi(account, pool, ranked, ruleReasons, results, today);
                } catch (Exception e) {
                    log.warn("AI suggestion failed for learner {}: {}", learnerId, e.getMessage());
                }
            }
            Map<Long, String> fallback = AiSuggestionRules.topUp(Map.of(), ranked, ruleReasons, results);
            return result(null, false, pool.learnerName(), recommendations.cardsFor(account, learnerId, new ArrayList<>(fallback.keySet()), fallback));
        }
    }

    private Map<String, Object> askAi(User account, Pool pool, List<Long> ranked, Map<Long, String> ruleReasons, int results, LocalDate today) {
        Map<Long, Item> items = itemRepository.findAllById(ranked).stream().collect(Collectors.toMap(Item::getId, i -> i));
        ranked = capPerPartner(ranked, items);
        AnthropicClient.Answer answer = anthropic.ask(AiSuggestionRules.systemPrompt(results), userPrompt(pool, items, ranked), 1800);
        Map<Long, String> picks = AiSuggestionRules.parsePicks(answer.text(), Set.copyOf(ranked), results);
        // The call is paid for either way: an unusable answer saves the rule ranking, so the learner is not asked again today.
        boolean usable = !picks.isEmpty();
        if (!usable) log.warn("AI answer for learner {} had no valid picks: {}", pool.learnerId(), answer.text().length() > 500 ? answer.text().substring(0, 500) : answer.text());
        Map<Long, String> finalPicks = AiSuggestionRules.topUp(picks, ranked, ruleReasons, results);
        List<Map<String, Object>> stored = finalPicks.entrySet().stream()
                .map(e -> Map.<String, Object>of("itemId", e.getKey(), "reason", e.getValue())).toList();
        Long id;
        try {
            jdbc.update("INSERT INTO ai_suggestions (user_id, learner_id, day, model, status, candidates, input_tokens, output_tokens, items_json) VALUES (?,?,?,?,?,?,?,?,?)",
                    account.getId(), pool.learnerId(), today, anthropic.model(), usable ? "ai" : "fallback", ranked.size(), answer.inputTokens(), answer.outputTokens(), toJson(stored));
            id = jdbc.queryForObject("SELECT id FROM ai_suggestions WHERE learner_id = ? AND day = ?", Long.class, pool.learnerId(), today);
        } catch (DuplicateKeyException e) {
            return answer(account, pool.learnerId(), savedFor(pool.learnerId(), today));
        }
        return result(id, usable, pool.learnerName(), recommendations.cardsFor(account, pool.learnerId(), new ArrayList<>(finalPicks.keySet()), finalPicks));
    }

    /** No more than a few courses of one partner in the shortlist (a partner with many packages would fill it); the rest go last. */
    private static List<Long> capPerPartner(List<Long> ranked, Map<Long, Item> items) {
        Map<Long, Integer> perPartner = new HashMap<>();
        List<Long> kept = new ArrayList<>();
        List<Long> over = new ArrayList<>();
        for (Long id : ranked) {
            Item item = items.get(id);
            Long partner = item == null ? null : item.getUserId();
            if (partner == null || perPartner.merge(partner, 1, Integer::sum) <= MAX_PER_PARTNER) kept.add(id);
            else over.add(id);
        }
        kept.addAll(over);
        return kept;
    }

    private Map<String, Object> answer(User account, Long learnerId, Map<String, Object> saved) {
        Map<Long, String> reasons = new LinkedHashMap<>();
        for (Map<String, Object> pick : readJson((String) saved.get("items_json"))) {
            reasons.put(((Number) pick.get("itemId")).longValue(), String.valueOf(pick.get("reason")));
        }
        Long id = ((Number) saved.get("id")).longValue();
        String name = learnerLoader.require(account, learnerId).self() ? "Bạn" : learnerLoader.require(account, learnerId).name();
        return result(id, "ai".equals(saved.get("status")), name, recommendations.cardsFor(account, learnerId, new ArrayList<>(reasons.keySet()), reasons));
    }

    private Map<String, Object> result(Long id, boolean ai, String learnerName, List<Map<String, Object>> items) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("suggestionId", id);
        out.put("ai", ai);
        out.put("learnerName", learnerName);
        out.put("items", items);
        return out;
    }

    private Map<String, Object> savedFor(Long learnerId, LocalDate day) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT id, status, items_json FROM ai_suggestions WHERE learner_id = ? AND day = ?", learnerId, day);
        return rows.isEmpty() ? null : rows.get(0);
    }

    // ── Prompt ───────────────────────────────────────────────────────────────

    private String userPrompt(Pool pool, Map<Long, Item> items, List<Long> order) {
        StringBuilder text = new StringBuilder("NGƯỜI HỌC\n");
        text.append("- Tên: ").append(pool.learnerName()).append(pool.self() ? " (người lớn tự học)" : "").append('\n');
        if (pool.ageBounds() != null) {
            int[] age = pool.ageBounds();
            text.append("- Tuổi: ").append(age[0] == age[1] ? age[0] + "" : age[0] + " đến " + age[1]).append('\n');
        }
        appendInterests(text, pool.learnerId());
        List<String> learned = jdbc.queryForList("""
                SELECT DISTINCT i.title FROM items i WHERE i.id IN (
                  SELECT item_id FROM user_course_enrollments WHERE user_id = ?
                  UNION SELECT item_id FROM order_details WHERE user_id = ? AND status NOT LIKE 'cancel%') LIMIT 10""",
                String.class, pool.learnerId(), pool.learnerId());
        if (!learned.isEmpty()) text.append("- Đã học / đã mua: ").append(String.join("; ", learned)).append('\n');
        appendFeedback(text, pool.learnerId());

        Map<Long, List<String>> tags = tagsOf(items.keySet());
        text.append("\nDANH SÁCH ỨNG VIÊN (id | tên | hình thức | tuổi | giá | tag | mô tả | ghi chú của hệ thống)\n");
        Map<Long, Candidate> byId = pool.candidates().stream().collect(Collectors.toMap(Candidate::itemId, c -> c, (a, b) -> a));
        for (Long id : order) {
            Candidate c = byId.get(id);
            Item item = items.get(id);
            if (c == null) continue;
            if (item == null) continue;
            text.append(c.itemId()).append(" | ").append(clean(item.getTitle(), 80)).append(" | ").append(item.getSubtype() == null ? "" : item.getSubtype())
                    .append(" | ").append(ageRange(item)).append(" | ").append(item.getPrice() == null ? "?" : (item.getPrice() / 1000) + "k")
                    .append(" | ").append(String.join(",", tags.getOrDefault(c.itemId(), List.of())))
                    .append(" | ").append(clean(item.getShortContent(), SUMMARY_CHARS))
                    .append(" | ").append(clean(c.reasonText(), 70)).append('\n');
        }
        return text.toString();
    }

    private void appendInterests(StringBuilder text, Long learnerId) {
        Map<String, List<String>> bySource = new HashMap<>();
        jdbc.query("SELECT source, tag FROM learner_interests WHERE learner_id = ? ORDER BY id", rs -> {
            bySource.computeIfAbsent(rs.getString("source"), k -> new ArrayList<>()).add(rs.getString("tag"));
        }, learnerId);
        appendList(text, "Thích", bySource.get("likes"));
        appendList(text, "Phụ huynh muốn học thêm", bySource.get("wants"));
        List<String> budget = bySource.get("budget");
        if (budget != null && !budget.isEmpty()) text.append("- Ngân sách mỗi tháng: ").append(BUDGET_WORDS.getOrDefault(budget.get(0), budget.get(0))).append('\n');
    }

    private void appendList(StringBuilder text, String label, List<String> keys) {
        if (keys == null || keys.isEmpty()) return;
        text.append("- ").append(label).append(": ")
                .append(keys.stream().map(k -> {
                    String word = RecommendationService.interestWord(k);
                    return word == null ? k : word;
                }).collect(Collectors.joining(", "))).append('\n');
    }

    /** What this learner's parent disliked and liked before, and what parents complain about most, so the AI improves. */
    private void appendFeedback(StringBuilder text, Long learnerId) {
        List<Map<String, Object>> recent = jdbc.queryForList("""
                SELECT f.rating, f.reasons, f.comment, s.items_json FROM ai_suggestion_feedback f JOIN ai_suggestions s ON s.id = f.suggestion_id
                WHERE f.learner_id = ? ORDER BY f.id DESC LIMIT 3""", learnerId);
        for (Map<String, Object> row : recent) {
            boolean up = ((Number) row.get("rating")).intValue() > 0;
            List<String> titles = new ArrayList<>();
            for (Map<String, Object> pick : readJson((String) row.get("items_json"))) {
                if (titles.size() >= 5) break;
                itemRepository.findById(((Number) pick.get("itemId")).longValue()).ifPresent(i -> titles.add(clean(i.getTitle(), 50)));
            }
            String reasons = String.join(", ", AiSuggestionRules.reasonLabels((String) row.get("reasons")));
            text.append("- Lần trước gợi ý ").append(String.join("; ", titles)).append(": phụ huynh ").append(up ? "thích" : "chưa hài lòng");
            if (!reasons.isBlank()) text.append(" (").append(reasons).append(')');
            if (row.get("comment") != null) text.append(", ghi chú: ").append(clean((String) row.get("comment"), 120));
            text.append('\n');
        }
        List<String> common = new ArrayList<>();
        jdbc.queryForList("SELECT reasons FROM ai_suggestion_feedback WHERE rating < 0 AND reasons IS NOT NULL AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)", String.class)
                .stream().flatMap(csv -> java.util.Arrays.stream(csv.split(","))).collect(Collectors.groupingBy(k -> k, Collectors.counting()))
                .entrySet().stream().sorted(Map.Entry.<String, Long>comparingByValue().reversed()).limit(3)
                .forEach(e -> common.addAll(AiSuggestionRules.reasonLabels(e.getKey())));
        if (!common.isEmpty()) text.append("- Phụ huynh nói chung hay chê: ").append(String.join(", ", common)).append('\n');
    }

    private Map<Long, List<String>> tagsOf(Set<Long> itemIds) {
        Map<Long, List<String>> tags = new HashMap<>();
        if (itemIds.isEmpty()) return tags;
        String marks = itemIds.stream().map(id -> "?").collect(Collectors.joining(","));
        jdbc.query("SELECT it.item_id, t.name FROM item_tags it JOIN tags t ON t.id = it.tag_id WHERE it.item_id IN (" + marks + ") AND t.status = 1 ORDER BY t.sort_order, t.id",
                rs -> {
                    List<String> list = tags.computeIfAbsent(rs.getLong("item_id"), k -> new ArrayList<>());
                    if (list.size() < 4) list.add(rs.getString("name"));
                }, itemIds.toArray());
        return tags;
    }

    private static String ageRange(Item item) {
        Byte min = item.getAgesMin();
        Byte max = item.getAgesMax();
        if (min == null && max == null) return "mọi tuổi";
        return (min == null ? "?" : min) + "-" + (max == null ? "?" : max);
    }

    private static String clean(String text, int max) {
        if (text == null) return "";
        String plain = HtmlUtils.htmlUnescape(text).replaceAll("<[^>]*>", " ").replaceAll("[|\\r\\n]+", " ").replaceAll("\\s+", " ").trim();
        return plain.length() > max ? plain.substring(0, max) : plain;
    }

    private static String toJson(Object value) {
        try {
            return JSON.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static List<Map<String, Object>> readJson(String json) {
        try {
            return JSON.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    // ── Feedback ─────────────────────────────────────────────────────────────

    /** Thumbs up (`rating` 1) or down (-1) with quick reasons, once per suggestion (saving again replaces it). Returns the problem or null. */
    public String feedback(User account, Long suggestionId, Map<String, Object> body) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT learner_id, user_id FROM ai_suggestions WHERE id = ?", suggestionId);
        if (rows.isEmpty() || !account.getId().equals(((Number) rows.get(0).get("user_id")).longValue())) return "Không tìm thấy gợi ý";
        int rating = body.get("rating") instanceof Number n ? n.intValue() : 0;
        if (rating != 1 && rating != -1) return "Thiếu đánh giá";
        String reasons = String.join(",", AiSuggestionRules.cleanReasons(body.get("reasons"), rating));
        jdbc.update("""
                INSERT INTO ai_suggestion_feedback (suggestion_id, user_id, learner_id, rating, reasons, comment) VALUES (?,?,?,?,?,?)
                ON DUPLICATE KEY UPDATE rating = VALUES(rating), reasons = VALUES(reasons), comment = VALUES(comment)""",
                suggestionId, account.getId(), rows.get(0).get("learner_id"), rating, reasons.isEmpty() ? null : reasons, AiSuggestionRules.cleanComment(body.get("comment")));
        return null;
    }

    /** The feedback already given for a suggestion (so the page can show it), or null. */
    public Map<String, Object> feedbackOf(User account, Long suggestionId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT rating FROM ai_suggestion_feedback WHERE suggestion_id = ? AND user_id = ?", suggestionId, account.getId());
        return rows.isEmpty() ? null : Map.of("rating", rows.get(0).get("rating"));
    }
}
