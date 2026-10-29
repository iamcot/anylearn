package com.anylearn.backend.controller.studio;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.explore.ExploreCreatorService;
import com.anylearn.backend.service.studio.SocialQueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Routes for the content studio t2m (plan 19.A6 / 19.B8), called with its machine key or a creator's login: who it is,
 * the numbers of its posts, and social lines proposed for its own posts. Only creators.
 */
@RestController
@RequestMapping("/api/studio")
@RequiredArgsConstructor
public class StudioController {

    private final ExploreCreatorService creators;
    private final SocialQueueService queue;

    private boolean notCreator(User user) {
        return user == null || creators.levelOf(user.getId()) == null;
    }

    @GetMapping("/me")
    public ApiResponse<?> me(@AuthenticationPrincipal User user) {
        if (notCreator(user)) return ApiResponse.fail("Tài khoản này chưa là creator");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", user.getId());
        out.put("name", user.getName());
        out.put("level", creators.levelOf(user.getId()));
        out.put("machine", com.anylearn.backend.service.studio.StudioRequest.isMachine());
        return ApiResponse.ok(out);
    }

    @GetMapping("/stats")
    public ApiResponse<?> stats(@AuthenticationPrincipal User user, @RequestParam(defaultValue = "30") int days) {
        if (notCreator(user)) return ApiResponse.fail("Tài khoản này chưa là creator");
        return ApiResponse.ok(queue.stats(user.getId(), days));
    }

    /** Body {postId, channel, caption, scheduledAt?, campaign?}: a proposal the reviewers see in "Hàng đợi social". */
    @PostMapping("/social-queue")
    public ApiResponse<?> propose(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (notCreator(user)) return ApiResponse.fail("Tài khoản này chưa là creator");
        try {
            Object rawPost = body.get("postId");
            Long postId = rawPost instanceof Number n ? n.longValue() : null;
            String when = body.get("scheduledAt") == null ? null : String.valueOf(body.get("scheduledAt"));
            LocalDateTime at = when == null || when.isBlank() ? null : LocalDateTime.parse(when.trim().replace(' ', 'T').substring(0, Math.min(when.trim().length(), 19)));
            long id = queue.add(postId, (String) body.get("channel"), (String) body.get("caption"), null, at, (String) body.get("campaign"), user.getId(), user.getId());
            return ApiResponse.ok(Map.of("id", id));
        } catch (IllegalArgumentException | java.time.format.DateTimeParseException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }
}
