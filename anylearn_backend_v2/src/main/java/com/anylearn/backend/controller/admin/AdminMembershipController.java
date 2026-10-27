package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.membership.MemberTierService;
import com.anylearn.backend.service.membership.MembershipSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/** Back office page "Hạng thành viên & ưu đãi gia đình". */
@RestController
@RequestMapping("/admin/membership")
@RequiredArgsConstructor
public class AdminMembershipController {

    private final MembershipSettings settings;
    private final MemberTierService tiers;

    @GetMapping("/settings")
    public ApiResponse<?> get(@AuthenticationPrincipal User user) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        Map<String, Object> out = new LinkedHashMap<>(settings.current());
        out.put("distribution", tiers.distribution());
        return ApiResponse.ok(out);
    }

    @PutMapping("/settings")
    public ApiResponse<?> save(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        String problem = settings.save(body);
        return problem == null ? ApiResponse.ok(settings.current()) : ApiResponse.fail(problem);
    }

    /** Recount everybody now (otherwise it runs every night). */
    @PostMapping("/refresh")
    public ApiResponse<?> refresh(@AuthenticationPrincipal User user) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        tiers.refreshAll();
        return ApiResponse.ok(tiers.distribution());
    }

    private boolean isAdmin(User u) {
        return u != null && "admin".equals(u.getRole());
    }
}
