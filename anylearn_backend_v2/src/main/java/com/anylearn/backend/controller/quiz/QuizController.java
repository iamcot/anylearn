package com.anylearn.backend.controller.quiz;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.quiz.QuizBankService;
import com.anylearn.backend.service.quiz.QuizGameService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** The rank quiz game (plan 14, phase 4). Login needed for everything; grading happens on the server. */
@RestController
@RequestMapping("/api/quiz")
public class QuizController {

    private final QuizBankService bank;
    private final QuizGameService game;

    public QuizController(QuizBankService bank, QuizGameService game) {
        this.bank = bank;
        this.game = game;
    }

    private interface Call {
        Object run() throws RuntimeException;
    }

    private static ApiResponse<?> guarded(User user, Call call) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        try {
            return ApiResponse.ok(call.run());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    private static long number(Map<String, Object> body, String key) {
        Object value = body == null ? null : body.get(key);
        if (value instanceof Number n) return n.longValue();
        throw new IllegalArgumentException("Thiếu " + key);
    }

    private static String text(Map<String, Object> body, String key) {
        Object value = body == null ? null : body.get(key);
        return value == null ? null : value.toString();
    }

    /** Rank, stars, items, today's numbers; an unanswered question left behind is closed as wrong here. */
    @GetMapping("/me")
    public ApiResponse<?> me(@AuthenticationPrincipal User user) {
        return guarded(user, () -> game.me(user.getId()));
    }

    /** Body {mult?: mult2|mult3, shield?: bool, topic?: key}: takes the items and hands out the next question. */
    @PostMapping("/start")
    public ApiResponse<?> start(@AuthenticationPrincipal User user, @RequestBody(required = false) Map<String, Object> body) {
        return guarded(user, () -> game.start(user.getId(), text(body, "mult"), body != null && Boolean.TRUE.equals(body.get("shield")), text(body, "topic")));
    }

    /** Body {attemptId, item}: 50:50, community, time or swap. */
    @PostMapping("/lifeline")
    public ApiResponse<?> lifeline(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return guarded(user, () -> game.lifeline(user.getId(), number(body, "attemptId"), text(body, "item")));
    }

    /** Body {attemptId, option (position shown, null = no answer), away?}. */
    @PostMapping("/answer")
    public ApiResponse<?> answer(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return guarded(user, () -> game.answer(user.getId(), number(body, "attemptId"),
                body.get("option") instanceof Number n ? Integer.valueOf(n.intValue()) : null, Boolean.TRUE.equals(body.get("away"))));
    }

    @PostMapping("/box/open")
    public ApiResponse<?> openBox(@AuthenticationPrincipal User user) {
        return guarded(user, () -> game.openBox(user.getId()));
    }

    /** Body {item}: buys one with the game currency. */
    @PostMapping("/items/buy")
    public ApiResponse<?> buy(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return guarded(user, () -> game.buy(user.getId(), text(body, "item")));
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
