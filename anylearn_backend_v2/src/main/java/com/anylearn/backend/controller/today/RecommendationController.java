package com.anylearn.backend.controller.today;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.recommend.PathwayService;
import com.anylearn.backend.service.recommend.RecommendationService;
import com.anylearn.backend.service.today.LearnerLoader;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/** Plan 08: suggestions for a learner, their events and "Không quan tâm", and the public pathways. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final PathwayService pathwayService;
    private final LearnerLoader learnerLoader;
    private final JdbcTemplate jdbc;

    /** context = today (needs learnerId: the one card of /today) or order_success (needs orderId: suggestions for the siblings). */
    @GetMapping("/recommendations")
    public ApiResponse<?> recommendations(@RequestParam(defaultValue = "today") String context,
                                          @RequestParam(required = false) Long learnerId,
                                          @RequestParam(required = false) Long orderId,
                                          @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        if ("order_success".equals(context)) {
            if (orderId == null) return ApiResponse.fail("Thiếu mã đơn hàng");
            return ApiResponse.ok(recommendationService.forOrder(user, orderId));
        }
        return ApiResponse.ok(recommendationService.forToday(user, learnerId != null ? learnerId : user.getId()));
    }

    @PostMapping("/recommendations/events")
    public ApiResponse<?> event(@RequestBody Map<String, Object> body, @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        recommendationService.record(user, number(body, "learnerId"), number(body, "itemId"),
                text(body, "source"), text(body, "context"), text(body, "event"));
        return ApiResponse.ok();
    }

    @PostMapping("/recommendations/dismiss")
    public ApiResponse<?> dismiss(@RequestBody Map<String, Object> body, @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(recommendationService.dismiss(user, number(body, "learnerId"), number(body, "itemId")));
    }

    @GetMapping("/pathways/{slug}")
    public ApiResponse<?> pathway(@PathVariable String slug, @RequestParam(required = false) Long learnerId,
                                  @AuthenticationPrincipal User user) {
        return pathwayService.getPublic(slug, ownedBy(user, learnerId)).<ApiResponse<?>>map(ApiResponse::ok)
                .orElseGet(() -> ApiResponse.fail("Không tìm thấy lộ trình"));
    }

    /** The pathways this course is in and where it sits; with a learner, which steps they already have. */
    @GetMapping("/items/{id}/pathway")
    public ApiResponse<?> itemPathway(@PathVariable Long id, @RequestParam(required = false) Long learnerId,
                                      @AuthenticationPrincipal User user) {
        return ApiResponse.ok(pathwayService.forItem(id, ownedBy(user, learnerId)));
    }

    private Set<Long> ownedBy(User user, Long learnerId) {
        if (user == null || learnerId == null) return Set.of();
        try {
            learnerLoader.require(user, learnerId);
        } catch (IllegalArgumentException e) {
            return Set.of();
        }
        return new HashSet<>(jdbc.queryForList("""
                SELECT item_id FROM user_course_enrollments WHERE user_id = ?
                UNION SELECT item_id FROM order_details WHERE user_id = ? AND status NOT LIKE 'cancel%'""", Long.class, learnerId, learnerId));
    }

    private static Long number(Map<String, Object> body, String key) {
        return body.get(key) instanceof Number n ? n.longValue() : null;
    }

    private static String text(Map<String, Object> body, String key) {
        return body.get(key) instanceof String s ? s : null;
    }
}
