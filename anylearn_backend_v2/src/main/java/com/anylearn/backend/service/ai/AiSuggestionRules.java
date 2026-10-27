package com.anylearn.backend.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Pure rules of the AI suggestions: reading the model's answer, filling a short answer, and the quick feedback keys. */
public final class AiSuggestionRules {

    /** Quick feedback after a thumbs down (key -> label shown to the parent and to the AI). */
    public static final Map<String, String> DOWN_REASONS = labels(
            "wrong_age", "Không hợp độ tuổi", "too_far", "Quá xa", "too_expensive", "Giá cao",
            "already_know", "Bé đã học rồi", "wrong_schedule", "Không hợp lịch", "not_interested", "Bé không thích");
    /** Quick feedback after a thumbs up. */
    public static final Map<String, String> UP_REASONS = labels(
            "right_interest", "Đúng sở thích", "right_age", "Hợp độ tuổi", "good_price", "Giá hợp lý", "new_ideas", "Có ý tưởng mới");

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final int MAX_REASON_CHARS = 200;

    private AiSuggestionRules() {}

    private static Map<String, String> labels(String... pairs) {
        Map<String, String> map = new LinkedHashMap<>();
        for (int i = 0; i + 1 < pairs.length; i += 2) map.put(pairs[i], pairs[i + 1]);
        return map;
    }

    /**
     * Reads `{"picks":[{"id":1,"reason":"..."}]}` out of the model's text (it may add words around the JSON). Ids that
     * were not in the shortlist and repeated ids are dropped; at most `max` picks. Invalid text gives an empty map.
     */
    public static Map<Long, String> parsePicks(String text, Set<Long> allowed, int max) {
        Map<Long, String> picks = new LinkedHashMap<>();
        if (text == null) return picks;
        int from = text.indexOf('{');
        int to = text.lastIndexOf('}');
        if (from < 0 || to <= from) return picks;
        try {
            JsonNode list = JSON.readTree(text.substring(from, to + 1)).path("picks");
            for (JsonNode pick : list) {
                if (picks.size() >= max) break;
                long id = pick.path("id").asLong(0);
                if (id <= 0 || !allowed.contains(id) || picks.containsKey(id)) continue;
                String reason = pick.path("reason").asText("").trim();
                picks.put(id, reason.length() > MAX_REASON_CHARS ? reason.substring(0, MAX_REASON_CHARS) : reason);
            }
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
        return picks;
    }

    /** Adds courses from the rule ranking after the AI's picks until there are `max` (rows of the grid stay full). */
    public static Map<Long, String> topUp(Map<Long, String> picks, List<Long> ranked, Map<Long, String> ruleReasons, int max) {
        Map<Long, String> result = new LinkedHashMap<>(picks);
        for (Long id : ranked) {
            if (result.size() >= max) break;
            result.putIfAbsent(id, ruleReasons.getOrDefault(id, ""));
        }
        return result;
    }

    /** Keeps only known keys of the right rating, without repeats. */
    public static List<String> cleanReasons(Object raw, int rating) {
        Map<String, String> known = rating > 0 ? UP_REASONS : DOWN_REASONS;
        List<String> clean = new ArrayList<>();
        if (raw instanceof List<?> list) {
            for (Object item : list) {
                String key = String.valueOf(item);
                if (known.containsKey(key) && !clean.contains(key)) clean.add(key);
            }
        }
        return clean;
    }

    /** "too_far,too_expensive" -> ["Quá xa", "Giá cao"]. */
    public static List<String> reasonLabels(String csv) {
        List<String> out = new ArrayList<>();
        if (csv == null || csv.isBlank()) return out;
        for (String key : csv.split(",")) {
            String label = DOWN_REASONS.containsKey(key) ? DOWN_REASONS.get(key) : UP_REASONS.get(key);
            if (label != null) out.add(label);
        }
        return out;
    }

    public static String cleanComment(Object raw) {
        if (!(raw instanceof String text) || text.isBlank()) return null;
        String trimmed = text.trim();
        return trimmed.length() > 500 ? trimmed.substring(0, 500) : trimmed;
    }

    public static String systemPrompt(int results) {
        return """
                Bạn là người bạn đồng hành của các bậc phụ huynh trên anyLEARN, nền tảng khóa học cho trẻ em và người học ở Việt Nam.
                Hãy giúp chọn khoảng %d khóa học hợp nhất với người học trong DANH SÁCH ỨNG VIÊN, hợp nhất xếp trước. Ít hơn một chút cũng được nếu không đủ khóa thật sự hợp.
                Vài lưu ý nhỏ:
                - Chỉ chọn id có trong danh sách (mỗi id một lần), đừng thêm khóa ngoài danh sách.
                - Nghiêng về sở thích và điều phụ huynh muốn bé học, hợp ngân sách, nối tiếp những gì đã học, và đa dạng lĩnh vực.
                - Nếu phụ huynh từng chưa hài lòng điều gì, tránh lặp lại.
                - Cột "ghi chú của hệ thống" chỉ là gợi ý tham khảo, bạn không phải theo.
                - Lý do viết bằng tiếng Việt, ngắn gọn (khoảng 20 từ), thân thiện, gọi người học bằng tên.
                Trả lời bằng cách gọi công cụ pick_courses.
                """.formatted(results);
    }
}
