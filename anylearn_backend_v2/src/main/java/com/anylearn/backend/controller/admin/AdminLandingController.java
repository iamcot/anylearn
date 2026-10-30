package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.landing.LandingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.function.Supplier;

/** Back office page "Trang đích" (plan 19.A7): list, refresh, switch on/off, introduction (by hand or AI draft). */
@RestController
@RequestMapping("/admin/landing-pages")
@RequiredArgsConstructor
public class AdminLandingController {

    private final LandingService landing;

    private static ApiResponse<?> admin(User user, Supplier<ApiResponse<?>> action) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        try {
            return action.get();
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @GetMapping
    public ApiResponse<?> list(@AuthenticationPrincipal User user, @RequestParam(required = false) String filter) {
        return admin(user, () -> ApiResponse.ok(landing.list(filter)));
    }

    @PostMapping("/refresh")
    public ApiResponse<?> refresh(@AuthenticationPrincipal User user) {
        return admin(user, () -> {
            Map<String, Object> result = landing.refresh();
            return result.containsKey("error") ? ApiResponse.fail((String) result.get("error")) : ApiResponse.ok(result);
        });
    }

    @PutMapping("/{id}/enabled")
    public ApiResponse<?> enabled(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        return admin(user, () -> {
            landing.setEnabled(id, Boolean.TRUE.equals(body.get("enabled")));
            return ApiResponse.ok(true);
        });
    }

    @PostMapping("/enable-ready")
    public ApiResponse<?> enableReady(@AuthenticationPrincipal User user) {
        return admin(user, () -> ApiResponse.ok(Map.of("enabled", landing.enableAllReady())));
    }

    @PutMapping("/{id}/intro")
    public ApiResponse<?> intro(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        return admin(user, () -> {
            landing.saveIntro(id, (String) body.get("intro"), (String) body.get("status"));
            return ApiResponse.ok(true);
        });
    }

    @PostMapping("/{id}/intro/ai")
    public ApiResponse<?> writeIntro(@AuthenticationPrincipal User user, @PathVariable long id) {
        return admin(user, () -> ApiResponse.ok(landing.writeIntro(id)));
    }
}
