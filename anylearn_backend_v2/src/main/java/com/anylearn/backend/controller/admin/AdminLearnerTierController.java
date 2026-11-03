package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.learnertier.LearnerTierService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Back office "Cấp học viên" (plan 21): finished courses, revoke / restore / add, settings. */
@RestController
@RequestMapping("/admin/learner-tier")
@RequiredArgsConstructor
public class AdminLearnerTierController {

    private final LearnerTierService tiers;

    private static boolean admin(User u) { return u != null && "admin".equals(u.getRole()); }

    @GetMapping
    public ApiResponse<?> list(@AuthenticationPrincipal User user, @RequestParam(required = false) String q,
                               @RequestParam(defaultValue = "all") String status, @RequestParam(defaultValue = "0") int page) {
        if (!admin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(tiers.adminList(q, status, page));
    }

    @PutMapping("/{id}")
    public ApiResponse<?> status(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        if (!admin(user)) return ApiResponse.fail("Forbidden");
        tiers.adminSetStatus(id, String.valueOf(body.get("status")), body.get("note") == null ? null : String.valueOf(body.get("note")));
        return ApiResponse.ok(Map.of("id", id));
    }

    @PostMapping
    public ApiResponse<?> add(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (!admin(user)) return ApiResponse.fail("Forbidden");
        if (!(body.get("learnerId") instanceof Number l) || !(body.get("itemId") instanceof Number i)) return ApiResponse.fail("Thiếu người học hoặc khóa học");
        tiers.adminAdd(l.longValue(), i.longValue(), body.get("note") == null ? null : String.valueOf(body.get("note")));
        return ApiResponse.ok(Map.of("ok", true));
    }

    @PostMapping("/sync/{learnerId}")
    public ApiResponse<?> sync(@AuthenticationPrincipal User user, @PathVariable long learnerId) {
        if (!admin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(Map.of("added", tiers.sync(learnerId)));
    }

    @GetMapping("/settings")
    public ApiResponse<?> settings(@AuthenticationPrincipal User user) {
        if (!admin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(tiers.settings().asMap());
    }

    @PutMapping("/settings")
    public ApiResponse<?> saveSettings(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (!admin(user)) return ApiResponse.fail("Forbidden");
        String error = tiers.settings().save(body);
        return error != null ? ApiResponse.fail(error) : ApiResponse.ok(tiers.settings().asMap());
    }
}
