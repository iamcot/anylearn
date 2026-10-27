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

    public record Answer(String text, int inputTokens, int outputTokens) {}

    private final RestTemplate http;
    private final String baseUrl;
    private final String apiKey;
    private final String model;

    public AnthropicClient(@Qualifier("anthropicRestTemplate") RestTemplate http,
                           @Value("${app.ai.base-url:https://api.anthropic.com}") String baseUrl,
                           @Value("${app.ai.api-key:}") String apiKey,
                           @Value("${app.ai.model:claude-haiku-5-5}") String model) {
        this.http = http;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.model = model;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String model() {
        return model;
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
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");
        Map<String, Object> body = Map.of("model", model, "max_tokens", maxTokens, "system", system,
                "messages", List.of(Map.of("role", "user", "content", user)),
                "tools", List.of(PICK_TOOL), "tool_choice", Map.of("type", "tool", "name", "pick_courses"));
        JsonNode answer = http.postForObject(baseUrl + "/v1/messages", new HttpEntity<>(body, headers), JsonNode.class);
        if (answer == null) throw new IllegalStateException("Empty answer from the AI");
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
