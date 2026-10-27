package com.anylearn.backend.controller.points;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.service.points.ItemPointsResolver;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.points.expiry.PointExpiryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
public class PointsController {

    private final ItemRepository itemRepository;
    private final ItemPointsResolver itemPointsResolver;
    private final PointExpiryService pointExpiryService;

    /** The expiry rule in words (months, start day, first day points can go). Public: the explanation page shows it to guests. */
    @GetMapping("/expiry-policy")
    public ApiResponse<?> expiryPolicy() {
        return ApiResponse.ok(pointExpiryService.policy());
    }

    /** The rule plus the signed-in member's own schedule: which points last until which day. */
    @GetMapping("/expiry")
    public ApiResponse<?> expiry(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(pointExpiryService.summary(user.getId()));
    }

    /** anyPoints the buyer earns when the order of this course is approved. Public: the course page shows it to guests. */
    @GetMapping("/preview")
    public ApiResponse<?> preview(@RequestParam Long itemId) {
        return itemRepository.findById(itemId)
                .<ApiResponse<?>>map(item -> {
                    var preview = itemPointsResolver.buyerPointsPreview(item);
                    return ApiResponse.ok(Map.of("itemId", itemId, "points", preview.points(), "vndValue", preview.vndValue()));
                })
                .orElseGet(() -> ApiResponse.fail("Không tìm thấy khóa học"));
    }
}
