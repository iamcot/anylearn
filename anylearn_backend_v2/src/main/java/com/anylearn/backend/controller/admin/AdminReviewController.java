package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.reviews.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Reviews of every course in one list (the per-course tab is in AdminItemController). Hide, show and delete reuse its endpoints. */
@RestController
@RequestMapping("/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ApiResponse<?> list(@AuthenticationPrincipal User user,
                               @RequestParam(defaultValue = "all") String status,
                               @RequestParam(required = false) String q,
                               @RequestParam(defaultValue = "0") int page,
                               @RequestParam(defaultValue = "20") int size) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        Map<String, Object> result = reviewService.adminList(status, q, Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Object row : (List<?>) result.get("content")) {
            Map<?, ?> review = (Map<?, ?>) row;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", review.get("id"));
            m.put("itemId", review.get("item_id"));
            m.put("itemTitle", review.get("item_title"));
            m.put("userId", review.get("user_id"));
            m.put("userName", review.get("user_name"));
            m.put("rating", review.get("value"));
            m.put("comment", review.get("extra_value"));
            m.put("createdAt", review.get("created_at") != null ? review.get("created_at").toString() : "");
            m.put("verified", review.get("is_verified"));
            m.put("status", review.get("status"));
            m.put("partnerReply", review.get("partner_reply"));
            m.put("hiddenReason", review.get("hidden_reason"));
            m.put("resubmittedAt", review.get("resubmitted_at") != null ? review.get("resubmitted_at").toString() : null);
            m.put("scores", review.get("scores"));
            m.put("media", review.get("media"));
            rows.add(m);
        }
        return ApiResponse.ok(Map.of("content", rows, "total", result.get("total")));
    }
}
