package com.anylearn.backend.controller.fun;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.mission.MissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Weekly missions of Vui học (plan 15, section 6). Login needed; the path follows the check-in access mode. */
@RestController
@RequestMapping("/api/fun/missions")
@RequiredArgsConstructor
public class MissionController {

    private final MissionService missions;

    @GetMapping
    public ApiResponse<?> list(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(missions.view(user.getId()));
    }

    /** {@code key} is a mission key, or "bonus" for the free sticker of a week with enough missions done. */
    @PostMapping("/{key}/claim")
    public ApiResponse<?> claim(@AuthenticationPrincipal User user, @PathVariable String key) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        try {
            return ApiResponse.ok(missions.claim(user.getId(), key));
        } catch (IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }
}
