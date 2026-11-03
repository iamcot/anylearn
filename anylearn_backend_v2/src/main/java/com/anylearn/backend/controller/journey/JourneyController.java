package com.anylearn.backend.controller.journey;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.journey.JourneyService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** "Hành trình anyLEARN" (plan 21): the journey (public, locked for a visitor), claiming rewards, mission signals. */
@RestController
@RequestMapping("/api/journey")
@RequiredArgsConstructor
public class JourneyController {

    private final JourneyService journey;

    @GetMapping
    public ApiResponse<?> view(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(journey.view(user == null ? null : user.getId()));
    }

    @PostMapping("/claim")
    public ApiResponse<?> claim(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Cần đăng nhập");
        return ApiResponse.ok(journey.claim(user.getId()));
    }

    @PostMapping("/event")
    public ApiResponse<?> event(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (user == null) return ApiResponse.fail("Cần đăng nhập");
        return ApiResponse.ok(Map.of("recorded", journey.recordEvent(user.getId(), String.valueOf(body.get("type")))));
    }
}
