package com.anylearn.backend.controller.today;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.dto.today.ScheduleChangeRequest;
import com.anylearn.backend.dto.today.SessionActionRequest;
import com.anylearn.backend.service.today.TodayActions;
import com.anylearn.backend.service.today.TodayService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/today")
@RequiredArgsConstructor
public class TodayController {

    private final TodayService todayService;
    private final TodayActions todayActions;

    @GetMapping("/learners")
    public ApiResponse<?> learners(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(todayService.learners(user));
    }

    @GetMapping
    public ApiResponse<?> today(@RequestParam(required = false) Long learnerId,
                                @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(todayService.today(user, learnerId));
    }

    @PostMapping("/join")
    public ApiResponse<?> join(@RequestBody SessionActionRequest body, @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(todayActions.join(user, body.learnerId(), body.sessionKey()));
    }

    @PostMapping("/attendance")
    public ApiResponse<?> attendance(@RequestBody SessionActionRequest body, @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        todayActions.markAttended(user, body.learnerId(), body.sessionKey());
        return ApiResponse.ok();
    }

    @PostMapping("/requests")
    public ApiResponse<?> requestChange(@RequestBody ScheduleChangeRequest body, @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(todayActions.requestChange(
                user, body.learnerId(), body.sessionKey(), body.type(), body.note()));
    }
}
