package com.anylearn.backend.controller.social;

import com.anylearn.backend.dto.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/social")
public class SocialController {

    @GetMapping("/profile/{userId}")
    public ApiResponse<?> profilePublic(@PathVariable Long userId) {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/profile")
    public ApiResponse<?> profileAuth() {
        return ApiResponse.fail("Not implemented");
    }

    @GetMapping("/post/{postId}")
    public ApiResponse<?> post(@PathVariable Long postId) {
        return ApiResponse.fail("Not implemented");
    }

    @RequestMapping(value = "/{postId}/action", method = {RequestMethod.GET, RequestMethod.POST})
    public ApiResponse<?> action(@PathVariable Long postId, @RequestBody(required = false) Object body) {
        return ApiResponse.fail("Not implemented");
    }
}
