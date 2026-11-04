package com.anylearn.backend.controller.guestquiz;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.service.guestquiz.GuestQuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Guest quiz (plan 21): public, no login. */
@RestController
@RequestMapping("/api/guest-quiz")
@RequiredArgsConstructor
public class GuestQuizController {

    private final GuestQuizService quiz;

    @GetMapping
    public ApiResponse<?> questions() {
        return ApiResponse.ok(quiz.questions());
    }

    @PostMapping("/answer")
    public ApiResponse<?> answer(@RequestBody Map<String, Object> body) {
        if (!(body.get("questionId") instanceof Number q) || !(body.get("option") instanceof Number o)) return ApiResponse.fail("Thiếu câu trả lời");
        return ApiResponse.ok(quiz.answer(q.longValue(), o.intValue()));
    }
}
