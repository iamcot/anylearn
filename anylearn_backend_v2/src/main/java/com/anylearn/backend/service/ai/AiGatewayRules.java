package com.anylearn.backend.service.ai;

import java.util.List;
import java.util.Map;

/**
 * Pure checks of the AI gateway for partner apps (`POST /api/open/ai/tool`). A partner writes its own prompts;
 * AnyLearn keeps the key, picks the model per feature and counts the tokens.
 */
public final class AiGatewayRules {

    private AiGatewayRules() {}

    /** Every partner feature key starts with this; it is also how today's partner tokens are counted. */
    public static final String PARTNER_PREFIX = "11of_";
    /** Features a partner may call. A new one needs a key + label in {@link AiUsageService} and a place in {@link AiModelSettings#FEATURES}. */
    public static final List<String> FEATURES = List.of(AiUsageService.P11OF_QUIZ_WRITE, AiUsageService.P11OF_QUIZ_VERIFY);

    public static final int MAX_OUTPUT_TOKENS = 8000;
    public static final int MAX_PROMPT_CHARS = 60_000;
    public static final long DEFAULT_DAILY_TOKENS = 1_000_000;

    public record Request(String feature, String system, String user, int maxTokens, Map<String, Object> tool) {}

    /** What is wrong with the request, in Vietnamese, or null when it can be sent. */
    public static String problem(Request r) {
        if (r == null) return "Thiếu nội dung.";
        if (r.feature() == null || !FEATURES.contains(r.feature())) return "Tính năng không được phép: " + r.feature();
        if (blank(r.system()) || blank(r.user())) return "Thiếu system hoặc user.";
        if (r.system().length() + r.user().length() > MAX_PROMPT_CHARS) return "Prompt quá dài (tối đa " + MAX_PROMPT_CHARS + " ký tự).";
        if (r.maxTokens() < 1 || r.maxTokens() > MAX_OUTPUT_TOKENS) return "maxTokens phải từ 1 đến " + MAX_OUTPUT_TOKENS + ".";
        Map<String, Object> tool = r.tool();
        if (tool == null || !(tool.get("name") instanceof String name) || !name.matches("[a-zA-Z0-9_-]{1,64}")
                || !(tool.get("input_schema") instanceof Map<?, ?>)) {
            return "tool cần name (chữ, số, _ hoặc -) và input_schema.";
        }
        return null;
    }

    /** True when the call must be refused: the gateway is off (cap 0) or today's tokens reached the cap. */
    public static boolean overCap(long usedToday, long dailyCap) {
        return dailyCap <= 0 || usedToday >= dailyCap;
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }
}
