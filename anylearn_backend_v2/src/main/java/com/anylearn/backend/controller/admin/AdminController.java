package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.MeilisearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final MeilisearchService meilisearchService;

    @PostMapping("/reindex")
    public ApiResponse<?> reindex(@AuthenticationPrincipal User user) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        meilisearchService.reindexAll();
        return ApiResponse.ok("Reindex complete");
    }

    @PostMapping("/reindex/users")
    public ApiResponse<?> reindexUsers(@AuthenticationPrincipal User user) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        meilisearchService.reindexAllUsers();
        return ApiResponse.ok("User reindex complete");
    }
}
