package com.anylearn.backend.controller.fun;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.achievement.AchievementService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Shareable achievement banners of Vui học (plan 14, phase 6). The view by token is public (it is what a shared link opens). */
@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievements;

    @GetMapping
    public ApiResponse<?> mine(@AuthenticationPrincipal User user, @RequestParam(defaultValue = "20") int limit) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(achievements.mine(user.getId(), limit));
    }

    @GetMapping("/{token}")
    public ApiResponse<?> view(@PathVariable String token) {
        return achievements.publicView(token).<ApiResponse<?>>map(ApiResponse::ok).orElseGet(() -> ApiResponse.fail("Không tìm thấy banner này"));
    }

    @PostMapping("/{token}/open")
    public ApiResponse<?> open(@PathVariable String token) {
        achievements.countOpen(token);
        return ApiResponse.ok(Map.of("ok", true));
    }

    @PostMapping("/{token}/share")
    public ApiResponse<?> share(@AuthenticationPrincipal User user, @PathVariable String token) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(achievements.share(user.getId(), token));
    }
}
