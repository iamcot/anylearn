package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.S3Service;
import com.anylearn.backend.service.explore.BunnyStreamClient;
import com.anylearn.backend.service.explore.ExploreService;
import com.anylearn.backend.service.explore.ExploreSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.Map;

/** Back office of Khám phá (plan 14, phase 7): posts, comment moderation, comment ban, settings and numbers. */
@RestController
@RequestMapping("/admin/explore")
@RequiredArgsConstructor
public class AdminExploreController {

    private final ExploreService explore;
    private final ExploreSettings settings;
    private final S3Service s3Service;
    private final BunnyStreamClient bunny;

    private static boolean notAdmin(User user) {
        return user == null || !"admin".equals(user.getRole());
    }

    @GetMapping("/posts")
    public ApiResponse<?> posts(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", explore.adminPosts());
        out.put("stats", explore.stats());
        return ApiResponse.ok(out);
    }

    private static Long asLong(Object value) {
        return value instanceof Number n ? n.longValue() : null;
    }

    private ApiResponse<?> save(User user, Long id, Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        try {
            long saved = explore.savePost(id, (String) body.get("kind"), (String) body.get("title"), (String) body.get("body"), (String) body.get("mediaUrl"),
                    (String) body.get("posterUrl"), asLong(body.get("itemId")), (String) body.get("status"), Boolean.TRUE.equals(body.get("pinned")));
            return ApiResponse.ok(Map.of("id", saved));
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @PostMapping("/posts")
    public ApiResponse<?> create(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return save(user, null, body);
    }

    @PutMapping("/posts/{id}")
    public ApiResponse<?> update(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        return save(user, id, body);
    }

    /** Body `{mediaUrl, posterUrl}`: the clip of a post whose video has just finished uploading to Bunny. */
    @PutMapping("/posts/{id}/media")
    public ApiResponse<?> attachMedia(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        try {
            explore.attachMedia(id, (String) body.get("mediaUrl"), (String) body.get("posterUrl"));
            return ApiResponse.ok(Map.of("ok", true));
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @DeleteMapping("/posts/{id}")
    public ApiResponse<?> delete(@AuthenticationPrincipal User user, @PathVariable long id) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        explore.deletePost(id);
        return ApiResponse.ok(Map.of("ok", true));
    }

    /** A photo for a post or a clip poster; returns its link. */
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ApiResponse<?> upload(@AuthenticationPrincipal User user, @RequestParam MultipartFile image) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        if (image == null || image.isEmpty()) return ApiResponse.fail("Chưa chọn hình");
        try {
            return ApiResponse.ok(Map.of("url", s3Service.uploadImage(image, "explore")));
        } catch (Exception e) {
            return ApiResponse.fail("Upload hình thất bại: " + e.getMessage());
        }
    }

    /** Whether clips can be uploaded to Bunny Stream (the three `BUNNY_STREAM_*` variables are set). */
    @GetMapping("/video-upload/status")
    public ApiResponse<?> videoUploadStatus(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(Map.of("enabled", bunny.isEnabled()));
    }

    /** Creates the video on Bunny and returns the signed TUS upload info plus the links to save on the post. */
    @PostMapping("/video-upload")
    public ApiResponse<?> videoUpload(@AuthenticationPrincipal User user, @RequestBody(required = false) Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        if (!bunny.isEnabled()) return ApiResponse.fail("Chưa cấu hình Bunny Stream, hãy dán link video");
        try {
            return ApiResponse.ok(bunny.createUpload(body != null && body.get("title") instanceof String t ? t : null));
        } catch (Exception e) {
            return ApiResponse.fail("Không tạo được video trên Bunny: " + e.getMessage());
        }
    }

    @GetMapping("/comments")
    public ApiResponse<?> comments(@AuthenticationPrincipal User user, @RequestParam(defaultValue = "all") String filter, @RequestParam(defaultValue = "1") int page) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(explore.adminComments(filter, page));
    }

    @PutMapping("/comments/{id}/status")
    public ApiResponse<?> commentStatus(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        try {
            explore.setCommentStatus(id, "visible".equals(body.get("status")));
            return ApiResponse.ok(Map.of("ok", true));
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @PutMapping("/comments/{id}/keep")
    public ApiResponse<?> keep(@AuthenticationPrincipal User user, @PathVariable long id) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        explore.keepComment(id);
        return ApiResponse.ok(Map.of("ok", true));
    }

    @PutMapping("/users/{userId}/comment-ban")
    public ApiResponse<?> ban(@AuthenticationPrincipal User user, @PathVariable long userId, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        explore.setBan(userId, Boolean.TRUE.equals(body.get("banned")), body.get("reason") instanceof String s ? s : null);
        return ApiResponse.ok(Map.of("ok", true));
    }

    @GetMapping("/settings")
    public ApiResponse<?> settings(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(settings.asMap());
    }

    @PutMapping("/settings")
    public ApiResponse<?> saveSettings(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        settings.save(body);
        return ApiResponse.ok(settings.asMap());
    }
}
