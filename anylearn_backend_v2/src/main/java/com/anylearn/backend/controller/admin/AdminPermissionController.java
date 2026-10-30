package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.adminaccess.AdminAccessService;
import com.anylearn.backend.service.adminaccess.AdminPermissions;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Back office "Cài đặt" > "Người duyệt nội dung" (plan 19.A5): who may open part of the back office without being admin. */
@RestController
@RequestMapping("/admin/permissions")
@RequiredArgsConstructor
public class AdminPermissionController {

    private final AdminAccessService access;

    @GetMapping
    public ApiResponse<?> list(@AuthenticationPrincipal User user) {
        if (!AdminAccessService.isAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(Map.of("people", access.list(), "labels", AdminPermissions.LABELS));
    }

    /** Body {permissions: ["content_review"]}; an empty list takes the person out of the back office. */
    @PutMapping("/{userId}")
    public ApiResponse<?> set(@AuthenticationPrincipal User user, @PathVariable long userId, @RequestBody Map<String, Object> body) {
        if (!AdminAccessService.isAdmin(user)) return ApiResponse.fail("Forbidden");
        List<String> permissions = body.get("permissions") instanceof List<?> list ? list.stream().map(String::valueOf).toList() : List.of();
        try {
            access.set(userId, permissions, user.getId());
            return ApiResponse.ok(Map.of("ok", true));
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }
}
