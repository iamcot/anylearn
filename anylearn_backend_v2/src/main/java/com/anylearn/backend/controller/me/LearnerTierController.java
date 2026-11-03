package com.anylearn.backend.controller.me;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.learnertier.LearnerTierService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Learner tier (plan 21): the account and its children with their finished courses; "Đã hoàn thành" by the parent. */
@RestController
@RequestMapping("/api/me/learner-tier")
@RequiredArgsConstructor
public class LearnerTierController {

    private final LearnerTierService tiers;

    @GetMapping
    public ApiResponse<?> mine(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Cần đăng nhập");
        return ApiResponse.ok(tiers.forAccount(user));
    }

    @PostMapping("/complete")
    public ApiResponse<?> complete(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (user == null) return ApiResponse.fail("Cần đăng nhập");
        if (!(body.get("enrollmentId") instanceof Number id)) return ApiResponse.fail("Thiếu khóa học");
        return ApiResponse.ok(tiers.markByParent(user, id.longValue()));
    }
}
