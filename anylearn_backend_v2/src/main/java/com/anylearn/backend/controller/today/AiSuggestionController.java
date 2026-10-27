package com.anylearn.backend.controller.today;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.ai.AiSuggestionRules;
import com.anylearn.backend.service.ai.AiSuggestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/** AI course suggestions for a learner (the account itself or a child): one saved answer per learner per day. */
@RestController
@RequestMapping("/api/ai-suggestions")
@RequiredArgsConstructor
public class AiSuggestionController {

    private final AiSuggestionService aiSuggestions;

    /** Today's suggestions for `learnerId` (asks the AI the first time each day). Body: {learnerId}. */
    @PostMapping
    public ApiResponse<?> suggest(@RequestBody Map<String, Object> body, @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        Long learnerId = body.get("learnerId") instanceof Number n ? n.longValue() : user.getId();
        try {
            Map<String, Object> result = new LinkedHashMap<>(aiSuggestions.suggest(user, learnerId));
            if (result.get("suggestionId") instanceof Number id) result.put("feedback", aiSuggestions.feedbackOf(user, id.longValue()));
            return ApiResponse.ok(result);
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    /** Body: {rating: 1 | -1, reasons: [keys], comment}. */
    @PostMapping("/{id}/feedback")
    public ApiResponse<?> feedback(@PathVariable Long id, @RequestBody Map<String, Object> body, @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        String problem = aiSuggestions.feedback(user, id, body);
        return problem == null ? ApiResponse.ok("OK") : ApiResponse.fail(problem);
    }

    /** Public: whether the feature is on (switch in the back office and a key on the server); the site hides its entry cards when not. */
    @GetMapping("/status")
    public ApiResponse<?> status() {
        return ApiResponse.ok(Map.of("enabled", aiSuggestions.isActive()));
    }

    /** Quick feedback choices (key + label) for the thumbs. */
    @GetMapping("/feedback-options")
    public ApiResponse<?> options() {
        return ApiResponse.ok(Map.of("up", AiSuggestionRules.UP_REASONS, "down", AiSuggestionRules.DOWN_REASONS));
    }
}
