package com.anylearn.backend.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/** Calls the Anthropic Messages API. The key comes from `ANTHROPIC_API_KEY` and never leaves the server. */
@Component
public class AnthropicClient {

    /** Models that answer 400 to `tool_choice` type tool or any. */
    static final java.util.Set<String> NO_FORCED_TOOL_CHOICE = java.util.Set.of("claude-opus-5-5", "claude-sonnet-5-5", "claude-fable-5-1");
    /** Extra output tokens for the thinking of those models, so a small max_tokens is not used up before the tool call. */
    static final int THINKING_ROOM = 4000;

    public record Answer(String text, int inputTokens, int outputTokens) {}

    private final RestTemplate http;
    private final String baseUrl;
    private final String apiKey;
    private final String model;
    private final AiUsageService usage;
    private final AiModelSettings models;

    public AnthropicClient(@Qualifier("anthropicRestTemplate") RestTemplate http,
                           @Value("${app.ai.base-url:https://api.anthropic.com}") String baseUrl,
                           @Value("${app.ai.api-key:}") String apiKey,
                           @Value("${app.ai.model:claude-haiku-5-5}") String model,
                           AiUsageService usage,
                           AiModelSettings models) {
        this.usage = usage;
        this.models = models;
        this.http = http;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.model = model;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** The default model (`app.ai.model`); a feature may be set to another one, see {@link #model(String)}. */
    public String model() {
        return model;
    }

    /** The model the feature is set to right now. */
    public String model(String feature) {
        return models.modelFor(feature);
    }

    private static final Map<String, Object> PICK_TOOL = Map.of(
            "name", "pick_courses",
            "description", "Ghi lại các khóa học đã chọn cho người học, hợp nhất xếp trước.",
            "input_schema", Map.of("type", "object",
                    "properties", Map.of("picks", Map.of("type", "array", "items", Map.of("type", "object",
                            "properties", Map.of(
                                    "id", Map.of("type", "integer", "description", "id của khóa học trong danh sách ứng viên"),
                                    "reason", Map.of("type", "string", "description", "lý do ngắn bằng tiếng Việt")),
                            "required", List.of("id", "reason")))),
                    "required", List.of("picks")));

    /** Asks for the picks as a tool call, so the answer is always valid JSON `{"picks":[{"id","reason"}]}`. */
    public Answer ask(String system, String user, int maxTokens) {
        return askTool(AiUsageService.SUGGEST, system, user, maxTokens, PICK_TOOL);
    }

    /** Same call with another forced tool: the answer is the tool's JSON input. Every call is logged under `feature` (see {@link AiUsageService}). */
    public Answer askTool(String feature, String system, String user, int maxTokens, Map<String, Object> tool) {
        String model = models.modelFor(feature);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");
        // These models refuse a forced tool_choice (400) and think before answering, which uses part of max_tokens:
        // ask for the tool in words, let the model choose it, and leave room for the thinking.
        boolean noForcedTool = NO_FORCED_TOOL_CHOICE.contains(model);
        String toolName = String.valueOf(tool.get("name"));
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("model", model);
        body.put("max_tokens", noForcedTool ? maxTokens + THINKING_ROOM : maxTokens);
        body.put("system", noForcedTool ? system + "\n\nTrả lời bằng cách gọi công cụ `" + toolName + "` đúng một lần, không viết gì ngoài lệnh gọi đó." : system);
        body.put("messages", List.of(Map.of("role", "user", "content", user)));
        body.put("tools", List.of(tool));
        body.put("tool_choice", noForcedTool ? Map.of("type", "auto") : Map.of("type", "tool", "name", toolName));
        long started = System.currentTimeMillis();
        JsonNode answer;
        try {
            answer = http.postForObject(baseUrl + "/v1/messages", new HttpEntity<>(body, headers), JsonNode.class);
        } catch (RuntimeException e) {
            usage.record(feature, model, 0, 0, System.currentTimeMillis() - started, String.valueOf(e.getMessage()));
            throw e;
        }
        long took = System.currentTimeMillis() - started;
        if (answer == null) {
            usage.record(feature, model, 0, 0, took, "Empty answer");
            throw new IllegalStateException("Empty answer from the AI");
        }
        usage.record(feature, model, usage(answer, "input_tokens"), usage(answer, "output_tokens"), took, null);
        StringBuilder text = new StringBuilder();
        for (JsonNode block : answer.path("content")) {
            if ("tool_use".equals(block.path("type").asText())) return new Answer(block.path("input").toString(), usage(answer, "input_tokens"), usage(answer, "output_tokens"));
            if ("text".equals(block.path("type").asText())) text.append(block.path("text").asText());
        }
        return new Answer(text.toString(), usage(answer, "input_tokens"), usage(answer, "output_tokens"));
    }

    private static int usage(JsonNode answer, String field) {
        return answer.path("usage").path(field).asInt(0);
    }
}
