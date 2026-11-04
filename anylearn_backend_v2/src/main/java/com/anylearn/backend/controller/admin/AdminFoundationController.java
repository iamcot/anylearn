package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.foundation.FoundationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Back office "anyLEARN Foundation" (plan 21): progress, settings, anyLEARN's own contribution, finished houses. */
@RestController
@RequestMapping("/admin/foundation")
@RequiredArgsConstructor
public class AdminFoundationController {

    private final FoundationService foundation;

    private static boolean admin(User u) { return u != null && "admin".equals(u.getRole()); }

    @GetMapping
    public ApiResponse<?> state(@AuthenticationPrincipal User user) {
        if (!admin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(foundation.adminState());
    }

    @PutMapping("/settings")
    public ApiResponse<?> settings(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (!admin(user)) return ApiResponse.fail("Forbidden");
        String error = foundation.settings().save(body);
        return error != null ? ApiResponse.fail(error) : ApiResponse.ok(foundation.adminState());
    }

    @PostMapping("/seed")
    public ApiResponse<?> seed(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (!admin(user)) return ApiResponse.fail("Forbidden");
        long amount = body.get("amount") instanceof Number n ? n.longValue() : 0;
        foundation.seed(amount, body.get("note") == null ? null : String.valueOf(body.get("note")));
        return ApiResponse.ok(foundation.adminState());
    }

    /** Foundation shares of orders paid before the Foundation existed: {portal, apply}; apply false = preview. */
    @PostMapping("/import-old")
    public ApiResponse<?> importOld(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (!admin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(foundation.importOldOrders(Boolean.TRUE.equals(body.get("portal")), Boolean.TRUE.equals(body.get("apply"))));
    }

    /** "Gỡ": takes one contribution back out of the house being built. */
    @PostMapping("/contributions/{id}/remove")
    public ApiResponse<?> remove(@AuthenticationPrincipal User user, @PathVariable long id) {
        if (!admin(user)) return ApiResponse.fail("Forbidden");
        try {
            foundation.remove(id);
            return ApiResponse.ok(foundation.adminState());
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @PutMapping("/houses/{no}")
    public ApiResponse<?> house(@AuthenticationPrincipal User user, @PathVariable int no, @RequestBody Map<String, Object> body) {
        if (!admin(user)) return ApiResponse.fail("Forbidden");
        foundation.updateHouse(no, body);
        return ApiResponse.ok(foundation.adminState());
    }
}
