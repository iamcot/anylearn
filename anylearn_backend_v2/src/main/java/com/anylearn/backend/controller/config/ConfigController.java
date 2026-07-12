package com.anylearn.backend.controller.config;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.service.ConfigService;
import com.anylearn.backend.service.MeilisearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ConfigController {

    private final ConfigService configService;
    private final MeilisearchService meilisearchService;

    @GetMapping({"/config/homev2/{role}", "/config/homev2"})
    public ApiResponse<?> homeV2(@PathVariable(required = false) String role) {
        return ApiResponse.ok(configService.homeV2(role != null ? role : "buyer"));
    }

    @GetMapping("/config/category")
    public ApiResponse<?> category(@RequestParam(required = false) Long catId) {
        return ApiResponse.ok(configService.getAllCategories());
    }

    @GetMapping("/event/{month}")
    public ApiResponse<?> event(@PathVariable String month) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/search")
    public ApiResponse<?> search(@RequestParam(required = false) String q,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "20") int pageSize,
                                  @RequestParam(required = false) String category,
                                  @RequestParam(required = false) String sort,
                                  @RequestParam(required = false) Long authorId,
                                  @RequestParam(required = false) String age,
                                  @RequestParam(required = false) String priceRange,
                                  @RequestParam(required = false) String location,
                                  @RequestParam(required = false) String mode) {
        var result = meilisearchService.search(q, page, pageSize, category, sort, authorId, age, priceRange, location, mode);
        return ApiResponse.ok(result);
    }

    @GetMapping("/search-tags")
    public ApiResponse<?> searchTags(@RequestParam(required = false) String q) {
        return ApiResponse.ok(configService.searchTags(q));
    }

    @GetMapping("/search/users")
    public ApiResponse<?> searchUsers(@RequestParam(required = false) String q,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int pageSize,
                                       @RequestParam(required = false) String role,
                                       @RequestParam(required = false) String sort,
                                       @RequestParam(required = false) Long authorId) {
        var result = meilisearchService.searchUsers(q, role, page, pageSize, sort, authorId);
        return ApiResponse.ok(result);
    }

    @GetMapping("/foundation")
    public ApiResponse<?> foundation() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/doc/{key}")
    public ApiResponse<?> getDoc(@PathVariable String key) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/report/ecommerce")
    public ApiResponse<?> reportEcommerce(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @PostMapping("/config/feedback")
    public ApiResponse<?> saveFeedback(@RequestBody Object body) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/config/transaction/{type}")
    public ApiResponse<?> transaction(@PathVariable String type) {
        return ApiResponse.fail("Not implemented");
    }
}
