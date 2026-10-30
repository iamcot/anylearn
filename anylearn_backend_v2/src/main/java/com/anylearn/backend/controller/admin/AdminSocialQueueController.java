package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.adminaccess.AdminAccessService;
import com.anylearn.backend.service.studio.SocialQueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.function.Supplier;

/** Back office "Khám phá" > "Hàng đợi social" (plan 19.A6): admins and content reviewers. */
@RestController
@RequestMapping("/admin/social-queue")
@RequiredArgsConstructor
public class AdminSocialQueueController {

    private final SocialQueueService queue;
    private final AdminAccessService access;

    private ApiResponse<?> run(User user, Supplier<Object> action) {
        if (!access.canReviewContent(user)) return ApiResponse.fail("Forbidden");
        try {
            return ApiResponse.ok(action.get());
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    static String text(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : String.valueOf(v);
    }

    static Long number(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v instanceof Number n) return n.longValue();
        if (v instanceof String s && s.matches("\\d+")) return Long.parseLong(s);
        return null;
    }

    /** "2026-11-02T12:00" or "2026-11-02 12:00:00" → a time; blank = none. */
    static LocalDateTime time(Map<String, Object> body, String key) {
        String v = text(body, key);
        if (v == null || v.isBlank()) return null;
        try {
            return LocalDateTime.parse(v.trim().replace(' ', 'T').substring(0, Math.min(v.trim().length(), 19)));
        } catch (Exception e) {
            throw new IllegalArgumentException("Giờ đăng không hợp lệ");
        }
    }

    @GetMapping
    public ApiResponse<?> list(@AuthenticationPrincipal User user, @RequestParam(defaultValue = "waiting") String status) {
        return run(user, () -> queue.list(status));
    }

    /** The tracked link of a post on a channel, for the form. */
    @GetMapping("/link")
    public ApiResponse<?> link(@AuthenticationPrincipal User user, @RequestParam long postId, @RequestParam String channel, @RequestParam(required = false) String campaign) {
        return run(user, () -> Map.of("link", queue.linkFor(postId, com.anylearn.backend.service.studio.StudioRules.cleanChannel(channel), campaign)));
    }

    @PostMapping
    public ApiResponse<?> add(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return run(user, () -> Map.of("id", queue.add(number(body, "postId"), text(body, "channel"), text(body, "caption"), text(body, "link"),
                time(body, "scheduledAt"), text(body, "campaign"), user.getId(), null)));
    }

    @PutMapping("/{id}")
    public ApiResponse<?> update(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        return run(user, () -> {
            queue.update(id, text(body, "channel"), text(body, "caption"), text(body, "link"), time(body, "scheduledAt"));
            return Map.of("ok", true);
        });
    }

    /** Body {status: posted | skipped | waiting, postedUrl?}. */
    @PutMapping("/{id}/status")
    public ApiResponse<?> status(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        return run(user, () -> {
            queue.setStatus(id, text(body, "status"), text(body, "postedUrl"));
            return Map.of("ok", true);
        });
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(@AuthenticationPrincipal User user, @PathVariable long id) {
        return run(user, () -> {
            queue.delete(id);
            return Map.of("ok", true);
        });
    }
}
