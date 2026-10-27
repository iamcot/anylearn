package com.anylearn.backend.controller.today;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.lifecycle.EnrollmentFeedbackService;
import com.anylearn.backend.service.lifecycle.RenewalService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Plan 07: mid-course survey and one-tap renewal. */
@RestController
@RequestMapping("/api/lifecycle")
@RequiredArgsConstructor
public class LifecycleController {

    private final EnrollmentFeedbackService feedbackService;
    private final RenewalService renewalService;

    @GetMapping("/surveys")
    public ApiResponse<?> surveys(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(feedbackService.pending(user));
    }

    @PostMapping("/feedback")
    public ApiResponse<?> feedback(@RequestBody Map<String, Object> body, @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        Long enrollmentId = body.get("enrollmentId") instanceof Number n ? n.longValue() : null;
        Integer score = body.get("score") instanceof Number n ? n.intValue() : null;
        String note = body.get("note") instanceof String s ? s : null;
        return ApiResponse.ok(feedbackService.answer(user, enrollmentId, score, note));
    }

    @PostMapping("/renew")
    public ApiResponse<?> renew(@RequestBody Map<String, Object> body, @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        Long enrollmentId = body.get("enrollmentId") instanceof Number n ? n.longValue() : null;
        return ApiResponse.ok(renewalService.renew(user, enrollmentId));
    }
}
