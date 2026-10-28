package com.anylearn.backend.controller.fun;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.explore.ExploreService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Khám phá for signed-in players (plan 14, phase 7): feed, likes, comments and reports. */
@RestController
@RequestMapping("/api/explore")
@RequiredArgsConstructor
public class ExploreController {

    private final ExploreService explore;

    @GetMapping
    public ApiResponse<?> feed(@AuthenticationPrincipal User user, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "10") int size) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(explore.feed(user.getId(), page, size));
    }

    @PostMapping("/{id}/view")
    public ApiResponse<?> view(@AuthenticationPrincipal User user, @PathVariable long id) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        explore.countView(user.getId(), id);
        return ApiResponse.ok(Map.of("ok", true));
    }

    @PostMapping("/{id}/share")
    public ApiResponse<?> share(@AuthenticationPrincipal User user, @PathVariable long id) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        explore.countShare(id);
        return ApiResponse.ok(Map.of("ok", true));
    }

    @PostMapping("/{id}/like")
    public ApiResponse<?> like(@AuthenticationPrincipal User user, @PathVariable long id) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        try {
            return ApiResponse.ok(explore.toggleLike(user.getId(), id));
        } catch (IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @GetMapping("/{id}/comments")
    public ApiResponse<?> comments(@AuthenticationPrincipal User user, @PathVariable long id, @RequestParam(defaultValue = "0") long before, @RequestParam(defaultValue = "20") int size) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(explore.comments(id, user.getId(), before, size));
    }

    @PostMapping("/{id}/comments")
    public ApiResponse<?> comment(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        try {
            return ApiResponse.ok(explore.addComment(user.getId(), id, body.get("body") instanceof String s ? s : null));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @DeleteMapping("/comments/{commentId}")
    public ApiResponse<?> deleteComment(@AuthenticationPrincipal User user, @PathVariable long commentId) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return explore.deleteOwnComment(user.getId(), commentId) ? ApiResponse.ok(Map.of("ok", true)) : ApiResponse.fail("Không xóa được bình luận này");
    }

    @PostMapping("/comments/{commentId}/report")
    public ApiResponse<?> report(@AuthenticationPrincipal User user, @PathVariable long commentId, @RequestBody Map<String, Object> body) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        try {
            explore.reportComment(user.getId(), commentId, body.get("reason") instanceof String s ? s : null);
            return ApiResponse.ok(Map.of("ok", true));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }
}
