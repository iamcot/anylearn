package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.Tag;
import com.anylearn.backend.entity.TagGroups;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.tags.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/tags")
@RequiredArgsConstructor
public class AdminTagController {

    private final com.anylearn.backend.service.adminaccess.AdminAccessService access;

    private final TagService tagService;

    @GetMapping
    public ApiResponse<?> list(@AuthenticationPrincipal User user,
                               @RequestParam(required = false) String group,
                               @RequestParam(required = false) String q) {
        // content reviewers pick tags for Khám phá posts (plan 19.A5)
        if (!access.canReviewContent(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(Map.of("tags", tagService.listForAdmin(group, q), "groups", TagGroups.LABELS));
    }

    @PostMapping
    public ApiResponse<?> create(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        try {
            Tag tag = tagService.create(text(body, "name"), text(body, "group"));
            return ApiResponse.ok(Map.of("id", tag.getId(), "name", tag.getName(), "group", tag.getTagGroup()));
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ApiResponse<?> update(@AuthenticationPrincipal User user, @PathVariable Long id,
                                 @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        try {
            Byte status = body.get("status") instanceof Number n ? n.byteValue() : null;
            Integer sortOrder = body.get("sortOrder") instanceof Number n ? n.intValue() : null;
            Tag tag = tagService.update(id, text(body, "name"), text(body, "group"), status, sortOrder);
            return ApiResponse.ok(Map.of("id", tag.getId()));
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @PostMapping("/{id}/merge")
    public ApiResponse<?> merge(@AuthenticationPrincipal User user, @PathVariable Long id,
                                @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        if (!(body.get("intoId") instanceof Number intoId)) return ApiResponse.fail("Thiếu tag đích");
        try {
            tagService.merge(id, intoId.longValue());
            return ApiResponse.ok("Merged");
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    private static String text(Map<String, Object> body, String key) {
        return body.get(key) instanceof String s ? s : null;
    }

    private boolean isAdmin(User user) {
        return user != null && "admin".equals(user.getRole());
    }
}
