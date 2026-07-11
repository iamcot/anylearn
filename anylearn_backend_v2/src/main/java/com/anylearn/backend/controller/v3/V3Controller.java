package com.anylearn.backend.controller.v3;

import com.anylearn.backend.dto.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v3")
public class V3Controller {

    @GetMapping("/home")
    public ApiResponse<?> home() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/auth/home")
    public ApiResponse<?> homeAuth() {
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
    public ApiResponse<?> searchAuth() {
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
}
