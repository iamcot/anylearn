package com.anylearn.backend.controller.config;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.service.reviews.TopRatedService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Home block "Khóa học được đánh giá cao": `{title, days, items}`, the period is set in the back office. */
@RestController
@RequestMapping("/api/top-rated")
@RequiredArgsConstructor
public class TopRatedController {

    private final TopRatedService topRatedService;

    @GetMapping
    public ApiResponse<?> topRated(@RequestParam(defaultValue = "24") int limit) {
        return ApiResponse.ok(topRatedService.topRated(limit));
    }
}
