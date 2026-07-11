package com.anylearn.backend.controller.article;

import com.anylearn.backend.dto.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ArticleController {

    @GetMapping("/v3/articles")
    public ApiResponse<?> articles() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/article")
    public ApiResponse<?> index() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/article/cat/{type}")
    public ApiResponse<?> loadByType(@PathVariable String type) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/article/{id}")
    public ApiResponse<?> loadArticle(@PathVariable Long id) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/quote")
    public ApiResponse<?> quote() {
        return ApiResponse.fail("Not implemented");
    }
}
