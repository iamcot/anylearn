package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.video.VideoCourseAdminService;
import com.anylearn.backend.service.video.VideoSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/** Back office of a video course (plan 17): chapters, lessons, order, "xem thử" switch, Bunny uploads and the settings. */
@RestController
@RequiredArgsConstructor
public class AdminVideoCourseController {

    private final VideoCourseAdminService videos;
    private final VideoSettings settings;

    private static boolean notAdmin(User user) {
        return user == null || !"admin".equals(user.getRole());
    }

    private static ApiResponse<?> run(User user, Supplier<Object> action) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        try {
            return ApiResponse.ok(action.get());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    private static String str(Map<String, Object> body, String key) {
        return body.get(key) instanceof String s ? s : null;
    }

    private static Boolean bool(Map<String, Object> body, String key) {
        return body.get(key) instanceof Boolean b ? b : null;
    }

    private static Long num(Map<String, Object> body, String key) {
        return body.get(key) instanceof Number n ? n.longValue() : null;
    }

    @SuppressWarnings("unchecked")
    private static VideoCourseAdminService.LessonDraft draft(Map<String, Object> b) {
        List<Map<String, Object>> attachments = null;
        if (b.get("attachments") instanceof List<?> list) {
            attachments = new ArrayList<>();
            for (Object o : list) if (o instanceof Map<?, ?> m) attachments.add((Map<String, Object>) m);
        }
        Long duration = num(b, "durationSeconds");
        return new VideoCourseAdminService.LessonDraft(num(b, "chapterId"), str(b, "title"), str(b, "description"), str(b, "type"), str(b, "typeValue"),
                bool(b, "free"), bool(b, "visible"), str(b, "posterUrl"), attachments, duration == null ? null : duration.intValue());
    }

    @GetMapping("/admin/items/{itemId}/video")
    public ApiResponse<?> tree(@AuthenticationPrincipal User user, @PathVariable long itemId) {
        return run(user, () -> videos.tree(itemId));
    }

    @PostMapping("/admin/items/{itemId}/video/chapters")
    public ApiResponse<?> addChapter(@AuthenticationPrincipal User user, @PathVariable long itemId, @RequestBody Map<String, Object> body) {
        return run(user, () -> Map.of("id", videos.saveChapter(itemId, null, str(body, "title"), str(body, "description"), bool(body, "visible"))));
    }

    @PutMapping("/admin/items/{itemId}/video/chapters/{chapterId}")
    public ApiResponse<?> editChapter(@AuthenticationPrincipal User user, @PathVariable long itemId, @PathVariable long chapterId, @RequestBody Map<String, Object> body) {
        return run(user, () -> Map.of("id", videos.saveChapter(itemId, chapterId, str(body, "title"), str(body, "description"), bool(body, "visible"))));
    }

    @DeleteMapping("/admin/items/{itemId}/video/chapters/{chapterId}")
    public ApiResponse<?> deleteChapter(@AuthenticationPrincipal User user, @PathVariable long itemId, @PathVariable long chapterId) {
        return run(user, () -> { videos.deleteChapter(itemId, chapterId); return Map.of(); });
    }

    @PostMapping("/admin/items/{itemId}/video/lessons")
    public ApiResponse<?> addLesson(@AuthenticationPrincipal User user, @PathVariable long itemId, @RequestBody Map<String, Object> body) {
        return run(user, () -> Map.of("id", videos.saveLesson(itemId, null, draft(body))));
    }

    @PutMapping("/admin/items/{itemId}/video/lessons/{lessonId}")
    public ApiResponse<?> editLesson(@AuthenticationPrincipal User user, @PathVariable long itemId, @PathVariable long lessonId, @RequestBody Map<String, Object> body) {
        return run(user, () -> Map.of("id", videos.saveLesson(itemId, lessonId, draft(body))));
    }

    /** Body `{free?, visible?}`: the two switches of the lesson list. */
    @PutMapping("/admin/items/{itemId}/video/lessons/{lessonId}/flags")
    public ApiResponse<?> flags(@AuthenticationPrincipal User user, @PathVariable long itemId, @PathVariable long lessonId, @RequestBody Map<String, Object> body) {
        return run(user, () -> { videos.setFlags(itemId, lessonId, bool(body, "free"), bool(body, "visible")); return Map.of(); });
    }

    @DeleteMapping("/admin/items/{itemId}/video/lessons/{lessonId}")
    public ApiResponse<?> deleteLesson(@AuthenticationPrincipal User user, @PathVariable long itemId, @PathVariable long lessonId) {
        return run(user, () -> { videos.deleteLesson(itemId, lessonId); return Map.of(); });
    }

    /** Body `{chapters: [{id, lessonIds: [...]}]}`: the whole order of chapters and lessons. */
    @SuppressWarnings("unchecked")
    @PutMapping("/admin/items/{itemId}/video/order")
    public ApiResponse<?> order(@AuthenticationPrincipal User user, @PathVariable long itemId, @RequestBody Map<String, Object> body) {
        return run(user, () -> {
            List<Map<String, Object>> chapters = new ArrayList<>();
            if (body.get("chapters") instanceof List<?> list) for (Object o : list) if (o instanceof Map<?, ?> m) chapters.add((Map<String, Object>) m);
            videos.reorder(itemId, chapters);
            return Map.of();
        });
    }

    /** Creates the lesson's video on Bunny and returns the signed TUS upload info. */
    @PostMapping("/admin/items/{itemId}/video/lessons/{lessonId}/upload")
    public ApiResponse<?> upload(@AuthenticationPrincipal User user, @PathVariable long itemId, @PathVariable long lessonId) {
        return run(user, () -> videos.startUpload(itemId, lessonId));
    }

    /** The browser finished sending the file. */
    @PostMapping("/admin/items/{itemId}/video/lessons/{lessonId}/uploaded")
    public ApiResponse<?> uploaded(@AuthenticationPrincipal User user, @PathVariable long itemId, @PathVariable long lessonId) {
        return run(user, () -> { videos.uploaded(itemId, lessonId); return Map.of(); });
    }

    @PostMapping("/admin/items/{itemId}/video/lessons/{lessonId}/refresh")
    public ApiResponse<?> refresh(@AuthenticationPrincipal User user, @PathVariable long itemId, @PathVariable long lessonId) {
        return run(user, () -> { videos.requireLessonOf(itemId, lessonId); return videos.refresh(lessonId); });
    }

    @GetMapping("/admin/video/settings")
    public ApiResponse<?> getSettings(@AuthenticationPrincipal User user) {
        return run(user, settings::asMap);
    }

    @PutMapping("/admin/video/settings")
    public ApiResponse<?> saveSettings(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return run(user, () -> {
            String problem = settings.check(body);
            if (problem != null) throw new IllegalArgumentException(problem);
            settings.save(body);
            return settings.asMap();
        });
    }
}
