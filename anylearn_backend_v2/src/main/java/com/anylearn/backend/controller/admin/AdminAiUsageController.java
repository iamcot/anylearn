package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
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

    @GetMapping
    public ApiResponse<?> report(@AuthenticationPrincipal User user, @RequestParam(defaultValue = "30") int days) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        Map<String, Object> out = new LinkedHashMap<>(usage.report(days));
        out.put("configured", anthropic.isConfigured());
        out.put("model", anthropic.model());
        return ApiResponse.ok(out);
    }
}
