package com.anylearn.backend.controller.points;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.service.points.ItemPointsResolver;
import lombok.RequiredArgsConstructor;
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
