package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.voucher.VoucherAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.function.Supplier;

/** Back office page "Voucher" (plan 20): groups, codes, events, grants, wallet lookup and the report. */
@RestController
@RequestMapping("/admin/vouchers")
@RequiredArgsConstructor
public class AdminVoucherController {

    private final VoucherAdminService admin;

    private static ApiResponse<?> admin(User user, Supplier<Object> action) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        try {
            return ApiResponse.ok(action.get());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @GetMapping("/groups")
    public ApiResponse<?> groups(@AuthenticationPrincipal User user, @RequestParam(required = false) String q) {
        return admin(user, () -> admin.groups(q));
    }

    @PostMapping("/groups")
    public ApiResponse<?> createGroup(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return admin(user, () -> Map.of("id", admin.saveGroup(null, body)));
    }

    @PutMapping("/groups/{id}")
    public ApiResponse<?> updateGroup(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        return admin(user, () -> Map.of("id", admin.saveGroup(id, body)));
    }

    @PutMapping("/groups/{id}/status")
    public ApiResponse<?> groupStatus(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        return admin(user, () -> { admin.setGroupStatus(id, Boolean.TRUE.equals(body.get("on"))); return Map.of("id", id); });
    }

    @GetMapping("/groups/{id}/codes")
    public ApiResponse<?> codes(@AuthenticationPrincipal User user, @PathVariable long id, @RequestParam(defaultValue = "0") int page) {
        return admin(user, () -> admin.codes(id, page));
    }

    @PostMapping("/groups/{id}/codes")
    public ApiResponse<?> addCodes(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        return admin(user, () -> admin.addCodes(id, body));
    }

    @PostMapping("/groups/{id}/grant")
    public ApiResponse<?> grant(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        return admin(user, () -> admin.grant(id, body));
    }

    @GetMapping("/events")
    public ApiResponse<?> events(@AuthenticationPrincipal User user) {
        return admin(user, admin::events);
    }

    @PostMapping("/events")
    public ApiResponse<?> createEvent(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return admin(user, () -> Map.of("id", admin.saveEvent(null, body)));
    }

    @PutMapping("/events/{id}")
    public ApiResponse<?> updateEvent(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        return admin(user, () -> Map.of("id", admin.saveEvent(id, body)));
    }

    @GetMapping("/wallet")
    public ApiResponse<?> wallet(@AuthenticationPrincipal User user, @RequestParam("who") String who) {
        return admin(user, () -> admin.walletOf(who));
    }

    @GetMapping("/report")
    public ApiResponse<?> report(@AuthenticationPrincipal User user, @RequestParam(defaultValue = "6") int months) {
        return admin(user, () -> admin.report(months));
    }
}
