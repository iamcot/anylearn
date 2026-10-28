package com.anylearn.backend.controller.fun;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.explore.ExploreService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

/** Khám phá for signed-in players (plan 14, phase 7): feed, likes, comments and reports. */
@RestController
@RequestMapping("/api/explore")
@RequiredArgsConstructor
public class ExploreController {

    private final ExploreService explore;

    /**
     * The feed for this person (plan 16.6). `since` = epoch milliseconds of when the list was opened (keeps pages stable),
     * `exclude` = post ids already on screen.
     */
    @GetMapping
    public ApiResponse<?> feed(@AuthenticationPrincipal User user, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "10") int size,
                               @RequestParam(required = false) Long since, @RequestParam(required = false) List<Long> exclude) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        LocalDateTime at = since == null ? null : LocalDateTime.ofInstant(Instant.ofEpochMilli(since), ZoneId.systemDefault());
        return ApiResponse.ok(explore.feed(user.getId(), page, size, at, exclude == null ? List.of() : exclude));
    }

    /** Posts matching words in the title, the description or a tag (empty = the feed). */
    @GetMapping("/search")
    public ApiResponse<?> search(@AuthenticationPrincipal User user, @RequestParam(required = false) String q, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "12") int size) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(explore.search(user.getId(), q, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<?> post(@AuthenticationPrincipal User user, @PathVariable long id) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        Map<String, Object> post = explore.post(user.getId(), id);
        return post == null ? ApiResponse.fail("Bài viết không còn") : ApiResponse.ok(post);
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
