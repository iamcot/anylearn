package com.anylearn.backend.controller.config;

import com.anylearn.backend.dto.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ConfigController {

    @GetMapping("/config/home/{role}")
    public ApiResponse<?> home(@PathVariable String role) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/config/homev2/{role}")
    public ApiResponse<?> homeV2(@PathVariable String role) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/config/category")
    public ApiResponse<?> category(@RequestParam(required = false) Long catId) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/event/{month}")
    public ApiResponse<?> event(@PathVariable String month) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/search")
    public ApiResponse<?> search(@RequestParam(required = false) String q) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/search-tags")
    public ApiResponse<?> searchTags(@RequestParam(required = false) String q) {
        return ApiResponse.fail("Not implemented");
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
