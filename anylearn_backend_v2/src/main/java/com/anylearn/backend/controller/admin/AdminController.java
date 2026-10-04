package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.AuthService;
import com.anylearn.backend.service.MeilisearchService;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.ZnsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final MeilisearchService meilisearchService;
    private final ZnsService znsService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final ConfigurationRepository configurationRepository;

    @PostMapping("/login")
    public ApiResponse<?> login(@RequestBody Map<String, String> body) {
        try {
            var response = authService.login(body.get("phone"), body.get("password"));
            if (!"admin".equals(response.getRole())) {
                return ApiResponse.fail("Forbidden: không có quyền admin");
            }
            return ApiResponse.ok(response);
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @PostMapping("/reindex")
    public ApiResponse<?> reindex(@AuthenticationPrincipal User user) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        meilisearchService.reindexAll();
        return ApiResponse.ok("Reindex complete");
    }

    @PostMapping("/reindex/users")
    public ApiResponse<?> reindexUsers(@AuthenticationPrincipal User user) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        meilisearchService.reindexAllUsers();
        return ApiResponse.ok("User reindex complete");
    }

    @GetMapping("/zns/authorize")
    public ApiResponse<?> znsAuthorize(@AuthenticationPrincipal User user) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(Map.of("url", znsService.getAuthorizeUrl()));
    }

    @GetMapping("/zns/callback")
    public ApiResponse<?> znsCallback(@RequestParam String code) {
        try {
            znsService.exchangeCodeForToken(code);
            return ApiResponse.ok("ZNS token saved successfully.");
        } catch (Exception e) {
            return ApiResponse.fail("Token exchange failed: " + e.getMessage());
        }
    }

    /**
     * Send in-app notification to a user by phone number.
     * Body: { phone, type, title, content, route?, extraContent? }
     * type "system_notif" is the standard broadcast type.
     */
    @PostMapping("/notification/send")
    public ApiResponse<?> sendNotification(@AuthenticationPrincipal User admin,
                                            @RequestBody Map<String, String> body) {
        if (admin == null || !"admin".equals(admin.getRole())) return ApiResponse.fail("Forbidden");

        String phone = body.get("phone");
        String type = body.getOrDefault("type", "system_notif");
        String title = body.get("title");
        String content = body.get("content");
        String route = body.get("route");
        String extraContent = body.get("extraContent");

        if (phone == null || content == null) {
            return ApiResponse.fail("phone và content là bắt buộc.");
        }

        var targetUser = userRepository.findByPhone(phone).orElse(null);
        if (targetUser == null) {
            return ApiResponse.fail("Không tìm thấy user với SĐT: " + phone);
        }

        var notif = notificationService.createNotification(targetUser.getId(), type, title, content, route, extraContent);
        return ApiResponse.ok(Map.of("notificationId", notif.getId(), "userId", targetUser.getId()));
    }

    @GetMapping("/config")
    public ApiResponse<?> getConfig(@AuthenticationPrincipal User user) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(configurationRepository.findAll());
    }

    @PutMapping("/config/{key}")
    public ApiResponse<?> updateConfig(
            @AuthenticationPrincipal User user,
            @PathVariable String key,
            @RequestBody Map<String, String> body) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        return configurationRepository.findById(key).map(c -> {
            c.setValue(body.get("value"));
            configurationRepository.save(c);
            return ApiResponse.ok(c);
        }).orElse(ApiResponse.fail("Config key not found: " + key));
    }
}
