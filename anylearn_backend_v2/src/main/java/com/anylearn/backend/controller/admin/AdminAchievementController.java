package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.achievement.AchievementService;
import com.anylearn.backend.service.achievement.AchievementSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/** Back office of the achievement banners (plan 14, phase 6): switches, milestones and what the shares bring. */
@RestController
@RequestMapping("/admin/achievements")
@RequiredArgsConstructor
public class AdminAchievementController {

    private final AchievementService achievements;
    private final AchievementSettings settings;

    private static boolean notAdmin(User user) {
        return user == null || !"admin".equals(user.getRole());
    }

    @GetMapping("/settings")
    public ApiResponse<?> settings(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(settings.asMap());
    }

    @PutMapping("/settings")
    public ApiResponse<?> saveSettings(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        String problem = settings.save(body);
        return problem == null ? ApiResponse.ok(settings.asMap()) : ApiResponse.fail(problem);
    }

    @GetMapping("/stats")
    public ApiResponse<?> stats(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("byType", achievements.stats());
        out.put("recent", achievements.recent(30));
        return ApiResponse.ok(out);
    }
}
