package com.anylearn.backend.controller.user;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.insights.CourseRequestInput;
import com.anylearn.backend.service.insights.CourseRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// "Tìm giúp tôi": open to visitors without an account (they leave a phone number); a logged-in person is linked to theirs.
@RestController
@RequestMapping("/api/course-requests")
@RequiredArgsConstructor
public class CourseRequestController {

    private final CourseRequestService service;

    @PostMapping
    public ApiResponse<?> create(@RequestBody CourseRequestInput input, @AuthenticationPrincipal User user) {
        var request = service.create(input, user != null ? user.getId() : null);
        return ApiResponse.ok(Map.of("id", request.getId()));
    }
}
