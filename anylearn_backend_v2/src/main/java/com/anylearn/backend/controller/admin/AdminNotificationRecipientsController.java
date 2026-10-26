package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.AdminRecipientsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/notification-recipients")
@RequiredArgsConstructor
public class AdminNotificationRecipientsController {

    private final AdminRecipientsService service;

    @GetMapping
    public ApiResponse<?> view(@AuthenticationPrincipal User user) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(service.view());
    }

    @PutMapping
    public ApiResponse<?> save(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        String problem = service.save(idsOf(body.get("userIds")), user.getId());
        return problem == null ? ApiResponse.ok(service.view()) : ApiResponse.fail(problem);
    }

    @PostMapping("/test")
    public ApiResponse<?> test(@AuthenticationPrincipal User user) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(Map.of("sent", service.sendTest()));
    }

    private static List<Long> idsOf(Object raw) {
        if (!(raw instanceof List<?> list)) return List.of();
        return list.stream().filter(Number.class::isInstance).map(item -> ((Number) item).longValue()).toList();
    }

    private static boolean isAdmin(User user) {
        return user != null && "admin".equals(user.getRole());
    }
}
