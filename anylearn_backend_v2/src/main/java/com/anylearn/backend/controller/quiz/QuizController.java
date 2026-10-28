package com.anylearn.backend.controller.quiz;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.quiz.QuizBankService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** The rank quiz (plan 14). Phase 2 only has the report button; the game itself comes in phase 4. */
@RestController
@RequestMapping("/api/quiz")
public class QuizController {

    private final QuizBankService bank;

    public QuizController(QuizBankService bank) {
        this.bank = bank;
    }

    @PostMapping("/questions/{id}/report")
    public ApiResponse<?> report(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody(required = false) Map<String, String> body) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        try {
            boolean added = bank.report(id, user.getId(), body == null ? null : body.get("reason"), body == null ? null : body.get("note"));
            return ApiResponse.ok(Map.of("reported", added));
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }
}
