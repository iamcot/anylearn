package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.insights.SearchInsightsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/insights")
@RequiredArgsConstructor
public class AdminInsightsController {

    private final SearchInsightsService insights;

    @GetMapping("/search")
    public ApiResponse<?> search(@AuthenticationPrincipal User user, @RequestParam(required = false) Integer days) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(insights.report(days));
    }
}
