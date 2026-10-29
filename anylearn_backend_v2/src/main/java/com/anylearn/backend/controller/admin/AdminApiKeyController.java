package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.adminaccess.AdminAccessService;
import com.anylearn.backend.service.studio.ApiKeyService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Machine keys of t2m (plan 19.A6), admins only: create (the key is shown once), list, revoke. */
@RestController
@RequestMapping("/admin/api-keys")
@RequiredArgsConstructor
public class AdminApiKeyController {

    private final ApiKeyService keys;

    @GetMapping
    public ApiResponse<?> list(@AuthenticationPrincipal User user) {
        if (!AdminAccessService.isAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(keys.list());
    }

    /** Body {name, userId}: the account the key acts as (a creator such as "anyLEARN Studio"). */
    @PostMapping
    public ApiResponse<?> create(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (!AdminAccessService.isAdmin(user)) return ApiResponse.fail("Forbidden");
        Long userId = AdminSocialQueueController.number(body, "userId");
        if (userId == null) return ApiResponse.fail("Chọn tài khoản cho khóa");
        try {
            return ApiResponse.ok(keys.create(AdminSocialQueueController.text(body, "name"), userId, user.getId()));
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> revoke(@AuthenticationPrincipal User user, @PathVariable long id) {
        if (!AdminAccessService.isAdmin(user)) return ApiResponse.fail("Forbidden");
        return keys.revoke(id) ? ApiResponse.ok(Map.of("ok", true)) : ApiResponse.fail("Khóa không còn hiệu lực");
    }
}
