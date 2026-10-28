package com.anylearn.backend.controller.fun;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.S3Service;
import com.anylearn.backend.service.explore.BunnyStreamClient;
import com.anylearn.backend.service.explore.ExploreCreatorService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/** A creator's own posts of Khám phá from /fun (plan 16). Every call checks that the caller is in the creator list. */
@RestController
@RequestMapping("/api/explore/creator")
@RequiredArgsConstructor
public class ExploreCreatorController {

    private final ExploreCreatorService creators;
    private final BunnyStreamClient bunny;
    private final S3Service s3Service;

    private static ApiResponse<?> run(User user, Supplier<Object> action) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        try {
            return ApiResponse.ok(action.get());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    private static Long asLong(Object value) {
        return value instanceof Number n ? n.longValue() : null;
    }

    private static List<Long> longs(Object value) {
        List<Long> out = new ArrayList<>();
        if (value instanceof List<?> list) for (Object v : list) if (v instanceof Number n) out.add(n.longValue());
        return out;
    }

    /** `{level}`: creator, s_creator or null; and whether clips can be uploaded. */
    @GetMapping("/me")
    public ApiResponse<?> me(@AuthenticationPrincipal User user) {
        return run(user, () -> {
            Map<String, Object> out = new LinkedHashMap<>(creators.me(user.getId()));
            out.put("videoUpload", bunny.isEnabled());
            return out;
        });
    }

    @GetMapping("/posts")
    public ApiResponse<?> posts(@AuthenticationPrincipal User user, @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "12") int size) {
        return run(user, () -> creators.myPosts(user.getId(), page, size));
    }

    @GetMapping("/posts/{id}")
    public ApiResponse<?> post(@AuthenticationPrincipal User user, @PathVariable long id) {
        return run(user, () -> creators.myPost(user.getId(), id));
    }

    private ApiResponse<?> save(User user, Long id, Map<String, Object> body) {
        return run(user, () -> Map.of("id", creators.save(user.getId(), id, (String) body.get("kind"), (String) body.get("title"), (String) body.get("body"),
                (String) body.get("mediaUrl"), (String) body.get("posterUrl"), asLong(body.get("itemId")), longs(body.get("tagIds")), Boolean.TRUE.equals(body.get("uploading")))));
    }

    /** Body `{kind, title, body, mediaUrl, posterUrl, itemId, tagIds, uploading}`; `uploading` = a clip is on its way to Bunny. */
    @PostMapping("/posts")
    public ApiResponse<?> create(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return save(user, null, body);
    }

    @PutMapping("/posts/{id}")
    public ApiResponse<?> update(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        return save(user, id, body);
    }

    @PutMapping("/posts/{id}/media")
    public ApiResponse<?> media(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        return run(user, () -> {
            creators.attachMedia(user.getId(), id, (String) body.get("mediaUrl"), (String) body.get("posterUrl"));
            return Map.of("ok", true);
        });
    }

    @PostMapping("/posts/{id}/hide")
    public ApiResponse<?> hide(@AuthenticationPrincipal User user, @PathVariable long id) {
        return run(user, () -> Map.of("status", creators.hide(user.getId(), id)));
    }

    @PostMapping("/posts/{id}/show")
    public ApiResponse<?> show(@AuthenticationPrincipal User user, @PathVariable long id) {
        return run(user, () -> Map.of("status", creators.show(user.getId(), id)));
    }

    @DeleteMapping("/posts/{id}")
    public ApiResponse<?> delete(@AuthenticationPrincipal User user, @PathVariable long id) {
        return run(user, () -> {
            creators.delete(user.getId(), id);
            return Map.of("ok", true);
        });
    }

    @GetMapping("/tags")
    public ApiResponse<?> tags(@AuthenticationPrincipal User user, @RequestParam(required = false) String q) {
        return run(user, () -> creators.tags(q));
    }

    /** A photo for a post or a clip poster (S3 folder `explore`); returns its link. */
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ApiResponse<?> upload(@AuthenticationPrincipal User user, @RequestParam MultipartFile image) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        if (creators.levelOf(user.getId()) == null) return ApiResponse.fail("Bạn chưa được mở quyền đăng bài Khám phá");
        if (image == null || image.isEmpty()) return ApiResponse.fail("Chưa chọn hình");
        try {
            return ApiResponse.ok(Map.of("url", s3Service.uploadImage(image, "explore")));
        } catch (Exception e) {
            return ApiResponse.fail("Tải hình thất bại: " + e.getMessage());
        }
    }

    /** Creates the video on Bunny and returns the signed TUS upload info (same as the back office). */
    @PostMapping("/video-upload")
    public ApiResponse<?> videoUpload(@AuthenticationPrincipal User user, @RequestBody(required = false) Map<String, Object> body) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        if (creators.levelOf(user.getId()) == null) return ApiResponse.fail("Bạn chưa được mở quyền đăng bài Khám phá");
        if (!bunny.isEnabled()) return ApiResponse.fail("Chưa bật tải video, hãy dán link YouTube");
        try {
            return ApiResponse.ok(bunny.createUpload(body != null && body.get("title") instanceof String t ? t : null));
        } catch (Exception e) {
            return ApiResponse.fail("Không tạo được video: " + e.getMessage());
        }
    }
}
