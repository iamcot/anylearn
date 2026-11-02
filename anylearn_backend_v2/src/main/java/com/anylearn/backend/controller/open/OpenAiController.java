package com.anylearn.backend.controller.open;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.service.ai.AiGatewayRules;
import com.anylearn.backend.service.ai.AiPartnerSettings;
import com.anylearn.backend.service.ai.AiUsageService;
import com.anylearn.backend.service.ai.AnthropicClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * AI gateway for partner apps (11 On Field): the partner sends its own prompt and a tool, AnyLearn calls Anthropic
 * with its key through {@link AnthropicClient#askTool} (so the call is logged and the model is the one picked for
 * the feature in the back office) and returns the tool's JSON. Same key as the ZNS relay; off while it is empty.
 */
@RestController
@RequestMapping("/api/open/ai")
@RequiredArgsConstructor
@Slf4j
public class OpenAiController {

    private final AnthropicClient anthropic;
    private final AiUsageService usage;
    private final AiPartnerSettings partnerSettings;
    private final ObjectMapper objectMapper;

    @Value("${zalo.zns.partnerApiKey:}")
    private String partnerApiKey;

    /** Body `{feature, system, user, maxTokens, tool}`; answer `{json, inputTokens, outputTokens, model}`. */
    @PostMapping("/tool")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<?>> tool(@RequestHeader(value = "X-Api-Key", required = false) String apiKey,
                                               @RequestBody Map<String, Object> body) {
        if (!PartnerApiKey.matches(partnerApiKey, apiKey)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.fail("Forbidden"));
        }
        AiGatewayRules.Request req = new AiGatewayRules.Request(
                str(body.get("feature")), str(body.get("system")), str(body.get("user")),
                body.get("maxTokens") instanceof Number n ? n.intValue() : 0,
                body.get("tool") instanceof Map<?, ?> m ? (Map<String, Object>) m : null);
        String problem = AiGatewayRules.problem(req);
        if (problem != null) return ResponseEntity.badRequest().body(ApiResponse.fail(problem));
        if (!anthropic.isConfigured()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(ApiResponse.fail("AnyLearn chưa có khóa AI."));
        }
        long cap = partnerSettings.dailyTokens();
        if (AiGatewayRules.overCap(usage.tokensToday(AiGatewayRules.PARTNER_PREFIX), cap)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(ApiResponse.fail(cap <= 0 ? "AI cho đối tác đang tắt." : "Đã hết hạn mức AI hôm nay."));
        }
        try {
            AnthropicClient.Answer answer = anthropic.askTool(req.feature(), req.system(), req.user(), req.maxTokens(), req.tool());
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("json", parseOrText(answer.text()));
            out.put("inputTokens", answer.inputTokens());
            out.put("outputTokens", answer.outputTokens());
            out.put("model", anthropic.model(req.feature()));
            return ResponseEntity.ok(ApiResponse.ok(out));
        } catch (RuntimeException e) {
            log.warn("[AI gateway] {} failed: {}", req.feature(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(ApiResponse.fail("Gọi AI không thành công."));
        }
    }

    /** The tool input as JSON; a plain text answer (the model skipped the tool) is passed on as a string. */
    private Object parseOrText(String text) {
        try {
            return objectMapper.readTree(text);
        } catch (Exception e) {
            return text;
        }
    }

    private static String str(Object v) {
        return v == null ? null : String.valueOf(v);
    }
}
