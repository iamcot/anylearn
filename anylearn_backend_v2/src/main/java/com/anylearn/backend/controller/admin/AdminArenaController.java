package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.arena.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Supplier;

/** Back office of Đấu trường Leo (plan 18): live view, settings, questions, history and flags. */
@RestController
@RequestMapping("/admin/arena")
@RequiredArgsConstructor
public class AdminArenaController {

    private final ArenaSettings settings;
    private final ArenaService arena;
    private final ArenaAdminService admin;
    private final ArenaSettlementService settlement;
    private final ArenaScheduler scheduler;

    private ApiResponse<?> run(User user, Supplier<Object> body) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        try {
            return ApiResponse.ok(body.get());
        } catch (IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    private Map<String, Object> settingsView() {
        Map<String, Object> out = settings.asMap();
        out.put("topics", admin.topics());
        out.put("plan", admin.planText());
        return out;
    }

    @GetMapping("/overview")
    public ApiResponse<?> overview(@AuthenticationPrincipal User user) {
        return run(user, admin::overview);
    }

    @GetMapping("/settings")
    public ApiResponse<?> settings(@AuthenticationPrincipal User user) {
        return run(user, this::settingsView);
    }

    @PutMapping("/settings")
    public ApiResponse<?> saveSettings(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        String problem = settings.save(body);
        if (problem != null) return ApiResponse.fail(problem);
        arena.refreshScheduled();
        arena.ensureUpcoming();
        return ApiResponse.ok(settingsView());
    }

    @PostMapping("/settings/test-notification")
    public ApiResponse<?> testNotification(@AuthenticationPrincipal User user) {
        return run(user, () -> scheduler.sendTest(user.getId()));
    }

    @GetMapping("/sessions")
    public ApiResponse<?> sessions(@AuthenticationPrincipal User user, @RequestParam(defaultValue = "0") int page) {
        return run(user, () -> admin.sessions(page));
    }

    @GetMapping("/sessions/{id}")
    public ApiResponse<?> session(@AuthenticationPrincipal User user, @PathVariable long id) {
        return run(user, () -> admin.sessionDetail(id));
    }

    @PutMapping("/sessions/{id}/questions/{qNo}")
    public ApiResponse<?> replace(@AuthenticationPrincipal User user, @PathVariable long id, @PathVariable int qNo, @RequestBody(required = false) Map<String, Object> body) {
        Long questionId = body != null && body.get("questionId") instanceof Number n ? n.longValue() : null;
        return run(user, () -> admin.replaceQuestion(id, qNo, questionId));
    }

    @PostMapping("/sessions/{id}/repick")
    public ApiResponse<?> repick(@AuthenticationPrincipal User user, @PathVariable long id) {
        return run(user, () -> admin.repick(id));
    }

    @PostMapping("/sessions/{id}/cancel")
    public ApiResponse<?> cancel(@AuthenticationPrincipal User user, @PathVariable long id) {
        return run(user, () -> admin.cancel(id));
    }

    /** Settles by hand when the job missed it. */
    @PostMapping("/sessions/{id}/settle")
    public ApiResponse<?> settle(@AuthenticationPrincipal User user, @PathVariable long id) {
        return run(user, () -> {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("settled", settlement.settle(id));
            return out;
        });
    }

    @GetMapping("/custom")
    public ApiResponse<?> custom(@AuthenticationPrincipal User user) {
        return run(user, admin::custom);
    }

    /** Creates the custom arena: {title, expectedAt (epoch ms, optional), questionCount?, answerSeconds?}. */
    @PostMapping("/custom")
    public ApiResponse<?> createCustom(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return run(user, () -> admin.createCustom(body.get("title") == null ? null : String.valueOf(body.get("title")),
                body.get("expectedAt") instanceof Number n ? n.longValue() : null,
                body.get("questionCount") instanceof Number n ? n.intValue() : null,
                body.get("answerSeconds") instanceof Number n ? n.intValue() : null));
    }

    @PostMapping("/custom/{id}/start")
    public ApiResponse<?> startCustom(@AuthenticationPrincipal User user, @PathVariable long id) {
        return run(user, () -> admin.startCustom(id));
    }

    @PostMapping("/custom/{id}/close")
    public ApiResponse<?> closeCustom(@AuthenticationPrincipal User user, @PathVariable long id) {
        return run(user, () -> admin.closeCustom(id));
    }

    @GetMapping("/flags")
    public ApiResponse<?> flags(@AuthenticationPrincipal User user) {
        return run(user, admin::flags);
    }

    @PostMapping("/sessions/{id}/entries/{userId}/clear")
    public ApiResponse<?> clear(@AuthenticationPrincipal User user, @PathVariable long id, @PathVariable long userId) {
        return run(user, () -> settlement.clearFlag(id, userId));
    }

    @PostMapping("/sessions/{id}/entries/{userId}/disqualify")
    public ApiResponse<?> disqualify(@AuthenticationPrincipal User user, @PathVariable long id, @PathVariable long userId) {
        return run(user, () -> settlement.disqualify(id, userId));
    }
}
