package com.anylearn.backend.controller.v3;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ItemUserActionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v3")
@RequiredArgsConstructor
public class V3Controller {

    private final ItemUserActionRepository itemUserActionRepository;

    @GetMapping("/home")
    public ApiResponse<?> home() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/auth/home")
    public ApiResponse<?> authHome() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/map")
    public ApiResponse<?> map() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/listing")
    public ApiResponse<?> listing() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/search")
    public ApiResponse<?> search() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/auth/search")
    public ApiResponse<?> authSearch() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/partner/{id}")
    public ApiResponse<?> partner(@PathVariable Long id) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/main-subtypes/{subtype}")
    public ApiResponse<?> mainSubtypes(@PathVariable String subtype) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/auth/main-subtypes/{subtype}")
    public ApiResponse<?> mainSubtypesAuth(@PathVariable String subtype) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/auth/cart")
    public ApiResponse<?> cart() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/auth/favorites")
    public ApiResponse<?> favorites(@AuthenticationPrincipal User user,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "20") int size) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(itemUserActionRepository.findFavedItemsByUser(
                user.getId(), PageRequest.of(page, size)));
    }
}
