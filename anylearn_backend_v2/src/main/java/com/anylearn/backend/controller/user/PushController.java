package com.anylearn.backend.controller.user;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.push.PushSubscribeRequest;
import com.anylearn.backend.service.push.WebPushService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushController {

    private final WebPushService pushService;

    // Public: the browser needs the key before the person is asked anything.
    @GetMapping("/public-key")
    public ApiResponse<?> publicKey() {
        Map<String, Object> data = new HashMap<>();
        data.put("enabled", pushService.isEnabled());
        data.put("publicKey", pushService.publicKey());
        return ApiResponse.ok(data);
    }

    @PostMapping("/subscribe")
    public ApiResponse<?> subscribe(@RequestBody PushSubscribeRequest request, @AuthenticationPrincipal User user) {
        if (!pushService.isEnabled()) return ApiResponse.fail("Thông báo đẩy chưa được bật trên máy chủ");
        if (!request.isComplete()) return ApiResponse.fail("Thiếu thông tin thiết bị");
        pushService.subscribe(user.getId(), request);
        return ApiResponse.ok();
    }

    @PostMapping("/unsubscribe")
    public ApiResponse<?> unsubscribe(@RequestBody Map<String, String> body, @AuthenticationPrincipal User user) {
        pushService.unsubscribe(user.getId(), body.get("endpoint"));
        return ApiResponse.ok();
    }

    @PostMapping("/test")
    public ApiResponse<?> test(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(Map.of("delivered", pushService.sendTest(user.getId())));
    }
}
