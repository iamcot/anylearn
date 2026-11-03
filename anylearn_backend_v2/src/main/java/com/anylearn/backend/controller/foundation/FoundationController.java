package com.anylearn.backend.controller.foundation;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.service.foundation.FoundationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** anyLEARN Foundation (plan 21): public progress, "Gạch của tôi", what a course gives. */
@RestController
@RequestMapping("/api/foundation")
@RequiredArgsConstructor
public class FoundationController {

    private final FoundationService foundation;
    private final ItemRepository itemRepository;

    @GetMapping
    public ApiResponse<?> state(@RequestParam(defaultValue = "30") int recent) {
        return ApiResponse.ok(foundation.publicState(recent));
    }

    @GetMapping("/item/{id}")
    public ApiResponse<?> forItem(@PathVariable Long id) {
        return itemRepository.findById(id).<ApiResponse<?>>map(i -> ApiResponse.ok(foundation.forItem(i)))
                .orElseGet(() -> ApiResponse.fail("Không tìm thấy khóa học"));
    }

    @GetMapping("/me")
    public ApiResponse<?> mine(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Cần đăng nhập");
        return ApiResponse.ok(foundation.mine(user.getId()));
    }

    @PostMapping("/hide-name")
    public ApiResponse<?> hideName(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (user == null) return ApiResponse.fail("Cần đăng nhập");
        foundation.setHideName(user.getId(), Boolean.TRUE.equals(body.get("hide")));
        return ApiResponse.ok(foundation.mine(user.getId()));
    }
}
