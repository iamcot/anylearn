package com.anylearn.backend.controller.me;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.me.MeSummaryService;
import com.anylearn.backend.service.notifications.NotificationPrefsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MeSummaryController {

    private final MeSummaryService summary;
    private final NotificationPrefsService prefs;

    @GetMapping("/me/summary")
    public ApiResponse<?> summary(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(summary.summary(user));
    }

    @GetMapping("/me/children/{childId}")
    public ApiResponse<?> child(@PathVariable Long childId, @AuthenticationPrincipal User user) {
        Map<String, Object> child = summary.child(user, childId);
        return child == null ? ApiResponse.fail("Không tìm thấy tài khoản con") : ApiResponse.ok(child);
    }

    /** topic -> channel -> on/off (everything is on until the person switches it off). */
    @GetMapping("/user/notification-prefs")
    public ApiResponse<?> getPrefs(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(prefs.matrix(user.getId()));
    }

    /** Body: {topic, channel, enabled}. */
    @PutMapping("/user/notification-prefs")
    public ApiResponse<?> setPref(@RequestBody Map<String, Object> body, @AuthenticationPrincipal User user) {
        String problem = prefs.set(user.getId(), String.valueOf(body.get("topic")), String.valueOf(body.get("channel")),
                Boolean.TRUE.equals(body.get("enabled")));
        return problem == null ? ApiResponse.ok(prefs.matrix(user.getId())) : ApiResponse.fail(problem);
    }
}
