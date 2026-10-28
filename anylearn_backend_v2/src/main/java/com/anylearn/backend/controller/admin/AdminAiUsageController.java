package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.ai.AiModelSettings;
import com.anylearn.backend.service.ai.AiPricing;
import com.anylearn.backend.service.ai.AiUsageService;
import com.anylearn.backend.service.ai.AnthropicClient;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/** Back office page "Dùng AI": tokens in and out of every feature that calls the Anthropic API. */
@RestController
@RequestMapping("/admin/ai-usage")
@RequiredArgsConstructor
public class AdminAiUsageController {

    private final AiUsageService usage;
    private final AnthropicClient anthropic;
    private final AiModelSettings modelSettings;

    @GetMapping
    public ApiResponse<?> report(@AuthenticationPrincipal User user, @RequestParam(defaultValue = "30") int days) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        Map<String, Object> out = new LinkedHashMap<>(usage.report(days));
        out.put("configured", anthropic.isConfigured());
        out.put("model", anthropic.model());
        return ApiResponse.ok(out);
    }

    private Map<String, Object> modelsView() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("defaultModel", modelSettings.defaultModel());
        out.put("models", AiPricing.MODELS.stream().map(m -> {
            double[] p = AiPricing.prices(m);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("model", m);
            row.put("priceInput", p[0]);
            row.put("priceOutput", p[1]);
            return row;
        }).toList());
        Map<String, String> current = modelSettings.current();
        out.put("features", AiModelSettings.FEATURES.stream().map(f -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("feature", f);
            row.put("label", AiUsageService.LABELS.getOrDefault(f, f));
            row.put("model", current.get(f));
            return row;
        }).toList());
        return out;
    }

    /** The model each AI feature uses, and the models an admin may pick (with their prices). */
    @GetMapping("/models")
    public ApiResponse<?> models(@AuthenticationPrincipal User user) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(modelsView());
    }

    /** Body `{models: {feature: model}}`; takes effect on the next call, no deploy needed. */
    @PutMapping("/models")
    public ApiResponse<?> saveModels(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        Map<String, String> picks = new LinkedHashMap<>();
        if (body.get("models") instanceof Map<?, ?> m) m.forEach((k, v) -> picks.put(String.valueOf(k), v == null ? null : String.valueOf(v)));
        try {
            modelSettings.save(picks);
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
        return ApiResponse.ok(modelsView());
    }
}
