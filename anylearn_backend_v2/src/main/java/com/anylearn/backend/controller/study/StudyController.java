package com.anylearn.backend.controller.study;

import com.anylearn.backend.dto.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v3/auth/study")
public class StudyController {

    @GetMapping
    public ApiResponse<?> index() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/lookup")
    public ApiResponse<?> lookup() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/{orderItemId}")
    public ApiResponse<?> show(@PathVariable Long orderItemId) {
        return ApiResponse.fail("Not implemented");
    }
}
