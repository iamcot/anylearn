package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.reviews.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/** How many records wait for the team, for the red numbers on the back office menu. */
@RestController
@RequestMapping("/admin/badges")
@RequiredArgsConstructor
public class AdminBadgeController {

    private final JdbcTemplate jdbc;
    private final ReviewService reviewService;

    @GetMapping
    public ApiResponse<?> counts(@AuthenticationPrincipal User user) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        Map<String, Object> counts = new LinkedHashMap<>();
        counts.put("orders", count("SELECT COUNT(*) FROM orders WHERE status = 'pay_pending'"));
        counts.put("transactions", count("SELECT COUNT(*) FROM transactions WHERE status = 0 AND type IN ('withdraw', 'deposit')"));
        counts.put("activities", count("SELECT COUNT(*) FROM item_activities WHERE status IS NULL OR status = 0"));
        counts.put("scheduleRequests", count("SELECT COUNT(*) FROM schedule_requests WHERE status = 'pending'"));
        counts.put("courseRequests", count("SELECT COUNT(*) FROM course_requests WHERE status <> 'closed'"));
        counts.put("priceReports", count("SELECT COUNT(*) FROM price_reports WHERE status NOT IN ('fixed', 'rejected')"));
        counts.put("reviewsResubmitted", reviewService.resubmittedCount());
        return ApiResponse.ok(counts);
    }

    private long count(String sql) {
        Long value = jdbc.queryForObject(sql, Long.class);
        return value == null ? 0 : value;
    }
}
