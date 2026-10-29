package com.anylearn.backend.controller.fun;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.arena.ArenaService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.function.Supplier;

/** Đấu trường Leo for players (plan 18). Login needed; the path follows the "arena" access mode of Vui học. */
@RestController
@RequestMapping("/api/arena")
@RequiredArgsConstructor
public class ArenaController {

    private final ArenaService arena;

    private ApiResponse<?> run(User user, Supplier<Object> body) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        try {
            return ApiResponse.ok(body.get());
        } catch (IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @GetMapping("/banner")
    public ApiResponse<?> banner(@AuthenticationPrincipal User user) {
        return run(user, () -> arena.banner(user.getId()));
    }

    @PostMapping("/register")
    public ApiResponse<?> register(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return run(user, () -> arena.register(user.getId(), ((Number) body.get("sessionId")).longValue()));
    }

    @DeleteMapping("/register")
    public ApiResponse<?> unregister(@AuthenticationPrincipal User user, @RequestParam long sessionId) {
        return run(user, () -> arena.unregister(user.getId(), sessionId));
    }

    /** Presence signal + state + board; the page calls it every 5 seconds in the lobby. */
    @PostMapping("/lobby")
    public ApiResponse<?> lobby(@AuthenticationPrincipal User user, @RequestParam(required = false) Long sessionId) {
        return run(user, () -> arena.lobby(user.getId(), sessionId));
    }

    /** Cheap check for the screens of a custom arena: {closed} turns true when the back office closes it. */
    @GetMapping("/custom-state")
    public ApiResponse<?> customState(@AuthenticationPrincipal User user, @RequestParam long sessionId) {
        return run(user, () -> arena.customState(sessionId));
    }

    @GetMapping("/question")
    public ApiResponse<?> question(@AuthenticationPrincipal User user, @RequestParam long sessionId, @RequestParam int qNo) {
        return run(user, () -> arena.question(user.getId(), sessionId, qNo));
    }

    @PostMapping("/answer")
    public ApiResponse<?> answer(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return run(user, () -> arena.answer(user.getId(), ((Number) body.get("sessionId")).longValue(), ((Number) body.get("qNo")).intValue(),
                ((Number) body.get("option")).intValue(), Boolean.TRUE.equals(body.get("away"))));
    }

    @GetMapping("/board")
    public ApiResponse<?> board(@AuthenticationPrincipal User user, @RequestParam(required = false) Long sessionId) {
        return run(user, () -> arena.board(user.getId(), sessionId));
    }
}
