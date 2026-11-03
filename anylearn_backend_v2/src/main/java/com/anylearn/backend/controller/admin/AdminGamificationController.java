package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.guestquiz.GuestQuizService;
import com.anylearn.backend.service.journey.JourneyService;
import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.entity.Configuration;
import java.time.LocalDateTime;
import com.anylearn.backend.service.milestone.MilestoneService;
import com.anylearn.backend.service.settings.NumberSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Back office "Hành trình & thưởng đơn đầu" (plan 21): journey settings and report, first-order / referral rewards. */
@RestController
@RequestMapping("/admin/gamification")
@RequiredArgsConstructor
public class AdminGamificationController {

    private final JourneyService journey;
    private final MilestoneService milestones;
    private final GuestQuizService guestQuiz;
    private final ConfigurationRepository configurationRepository;

    private static boolean admin(User u) { return u != null && "admin".equals(u.getRole()); }

    @GetMapping("/journey")
    public ApiResponse<?> journey(@AuthenticationPrincipal User user) {
        if (!admin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(journey.report());
    }

    @PutMapping("/journey/settings")
    public ApiResponse<?> saveJourney(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (!admin(user)) return ApiResponse.fail("Forbidden");
        return save(journey.settings(), body);
    }

    @GetMapping("/milestones")
    public ApiResponse<?> milestones(@AuthenticationPrincipal User user) {
        if (!admin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(milestones.report());
    }

    @PutMapping("/milestones/settings")
    public ApiResponse<?> saveMilestones(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (!admin(user)) return ApiResponse.fail("Forbidden");
        return save(milestones.settings(), body);
    }

    @GetMapping("/guest-quiz")
    public ApiResponse<?> guestQuiz(@AuthenticationPrincipal User user) {
        if (!admin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(guestQuiz.report());
    }

    /** Body `{numbers: {...}, topic}`: topic = a key of the quiz bank topics. */
    @PutMapping("/guest-quiz/settings")
    public ApiResponse<?> saveGuestQuiz(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (!admin(user)) return ApiResponse.fail("Forbidden");
        String error = guestQuiz.settings().save(body);
        if (error != null) return ApiResponse.fail(error);
        if (body.get("topic") instanceof String topic && !topic.isBlank()) {
            Configuration row = configurationRepository.findByKey(GuestQuizService.TOPIC_KEY).orElseGet(() -> {
                Configuration c = new Configuration();
                c.setKey(GuestQuizService.TOPIC_KEY);
                c.setType("text");
                c.setCreatedAt(LocalDateTime.now());
                return c;
            });
            row.setValue(topic.trim());
            row.setUpdatedAt(LocalDateTime.now());
            configurationRepository.save(row);
        }
        return ApiResponse.ok(guestQuiz.report());
    }

    private static ApiResponse<?> save(NumberSettings settings, Map<String, Object> body) {
        String error = settings.save(body);
        return error != null ? ApiResponse.fail(error) : ApiResponse.ok(settings.asMap());
    }
}
