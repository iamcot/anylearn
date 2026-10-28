package com.anylearn.backend.controller.study;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.video.VideoLearnService;
import com.anylearn.backend.service.video.VideoMilestoneService;
import com.anylearn.backend.service.video.VideoStudyService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/**
 * Video courses for learners (plan 17): the outline of a course page (public), playing a lesson (public for free
 * lessons), saving progress, the account's video courses, self-study plans and the suggestions after a course.
 */
@RestController
@RequiredArgsConstructor
public class LearnController {

    private final VideoLearnService learn;
    private final VideoStudyService study;
    private final VideoMilestoneService milestones;

    private static ApiResponse<?> run(Supplier<Object> action) {
        try {
            return ApiResponse.ok(action.get());
        } catch (IllegalArgumentException | IllegalStateException | VideoLearnService.LockedException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    private static Long num(Map<String, Object> body, String key) {
        return body.get(key) instanceof Number n ? n.longValue() : null;
    }

    @GetMapping("/api/items/{itemId}/video-outline")
    public ApiResponse<?> outline(@AuthenticationPrincipal User user, @PathVariable long itemId, @RequestParam(required = false) Long learnerId) {
        return run(() -> learn.outline(itemId, user, learnerId));
    }

    @GetMapping("/api/learn/lessons/{lessonId}/play")
    public ApiResponse<?> play(@AuthenticationPrincipal User user, @PathVariable long lessonId, @RequestParam(required = false) Long learnerId) {
        return run(() -> learn.play(lessonId, user, learnerId));
    }

    /** Body `{lessonId, learnerId?, positionSeconds, watchedDelta, done?}`. */
    @PostMapping("/api/learn/progress")
    public ApiResponse<?> progress(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        Long lessonId = num(body, "lessonId");
        if (lessonId == null) return ApiResponse.fail("Thiếu bài học");
        Long pos = num(body, "positionSeconds"), delta = num(body, "watchedDelta");
        return run(() -> learn.saveProgress(user, num(body, "learnerId"), lessonId, pos == null ? 0 : pos.intValue(),
                delta == null ? 0 : delta.intValue(), Boolean.TRUE.equals(body.get("done"))));
    }

    @GetMapping("/api/learn/my-courses")
    public ApiResponse<?> myCourses(@AuthenticationPrincipal User user, @RequestParam(required = false) Long learnerId) {
        return run(() -> learn.myCourses(user, learnerId));
    }

    /** For /today: courses in progress and today's self-study sessions. */
    @GetMapping("/api/learn/today")
    public ApiResponse<?> today(@AuthenticationPrincipal User user, @RequestParam(required = false) Long learnerId) {
        return run(() -> study.today(user, learnerId));
    }

    @GetMapping("/api/learn/plan")
    public ApiResponse<?> plan(@AuthenticationPrincipal User user, @RequestParam long learnerId, @RequestParam long itemId) {
        return run(() -> {
            Map<String, Object> plan = study.plan(user, learnerId, itemId);
            return plan == null ? Map.of() : plan;
        });
    }

    /** Body `{learnerId, itemId, weekdays: [1..7], time: "20:00", lessonsPerSession, enabled}`. */
    @PutMapping("/api/learn/plan")
    public ApiResponse<?> savePlan(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        Long learnerId = num(body, "learnerId"), itemId = num(body, "itemId"), per = num(body, "lessonsPerSession");
        if (learnerId == null || itemId == null) return ApiResponse.fail("Thiếu người học hoặc khóa học");
        List<Integer> days = new ArrayList<>();
        if (body.get("weekdays") instanceof List<?> list) for (Object o : list) if (o instanceof Number n) days.add(n.intValue());
        return run(() -> study.savePlan(user, learnerId, itemId, days, body.get("time") instanceof String s ? s : null,
                per == null ? 1 : per.intValue(), !Boolean.FALSE.equals(body.get("enabled"))));
    }

    @DeleteMapping("/api/learn/plan")
    public ApiResponse<?> deletePlan(@AuthenticationPrincipal User user, @RequestParam long learnerId, @RequestParam long itemId) {
        return run(() -> { study.deletePlan(user, learnerId, itemId); return Map.of(); });
    }

    /** Courses to take after this video course, for the learner (source `video`, like the other suggestion cards). */
    @GetMapping("/api/learn/suggestions")
    public ApiResponse<?> suggestions(@AuthenticationPrincipal User user, @RequestParam long itemId, @RequestParam long learnerId,
                                      @RequestParam(defaultValue = "3") int limit) {
        return run(() -> milestones.suggestions(user, learnerId, itemId, Math.max(1, Math.min(limit, 6))));
    }
}
