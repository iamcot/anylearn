package com.anylearn.backend.controller.fun;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.fun.CheckinService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The Vui học page (plan 14): daily check-in gift. Login needed. */
@RestController
@RequestMapping("/api/fun")
@RequiredArgsConstructor
public class FunController {

    private final CheckinService checkinService;

    @GetMapping("/checkin")
    public ApiResponse<?> checkin(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(checkinService.status(user.getId()));
    }

    @PostMapping("/checkin/claim")
    public ApiResponse<?> claim(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        try {
            return ApiResponse.ok(checkinService.claim(user.getId()));
        } catch (IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }
}
