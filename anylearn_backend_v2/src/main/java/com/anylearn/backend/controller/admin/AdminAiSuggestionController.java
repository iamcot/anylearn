package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.ai.AiSuggestionReport;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/** Back office: usage, click and order numbers of the AI suggestions and the parents' feedback. The switch lives in Cài đặt > Vận hành. */
@RestController
@RequestMapping("/admin/ai-suggestions")
@RequiredArgsConstructor
public class AdminAiSuggestionController {

    private final AiSuggestionReport report;

    @GetMapping("/stats")
    public ApiResponse<?> stats(@AuthenticationPrincipal User user, @RequestParam(required = false) String from, @RequestParam(required = false) String to) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        LocalDate end = to == null || to.isBlank() ? LocalDate.now() : LocalDate.parse(to.substring(0, 10));
        LocalDate start = from == null || from.isBlank() ? end.minusDays(29) : LocalDate.parse(from.substring(0, 10));
        return ApiResponse.ok(Map.of("summary", report.summary(start, end), "feedback", report.feedbackList(50)));
    }

    private boolean isAdmin(User user) {
        return user != null && "admin".equals(user.getRole());
    }
}
