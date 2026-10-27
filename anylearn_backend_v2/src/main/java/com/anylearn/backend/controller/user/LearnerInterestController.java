package com.anylearn.backend.controller.user;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.interests.LearnerInterestService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class LearnerInterestController {

    private final LearnerInterestService interests;

    @GetMapping("/children/{childId}/interests")
    public ApiResponse<?> get(@PathVariable Long childId, @AuthenticationPrincipal User user) {
        Map<String, Object> answers = interests.get(user, childId);
        return answers == null ? ApiResponse.fail("Không tìm thấy tài khoản con") : ApiResponse.ok(answers);
    }

    /** Body: {likes: [keys], wants: [keys], budget: key}. Everything is optional; it replaces the earlier answers. */
    @PutMapping("/children/{childId}/interests")
    public ApiResponse<?> save(@PathVariable Long childId, @RequestBody Map<String, Object> body, @AuthenticationPrincipal User user) {
        return interests.save(user, childId, body) ? ApiResponse.ok("OK") : ApiResponse.fail("Không tìm thấy tài khoản con");
    }

    /** The account owner's own survey (same body as for a child). */
    @GetMapping("/interests")
    public ApiResponse<?> getSelf(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(interests.get(user, user.getId()));
    }

    @PutMapping("/interests")
    public ApiResponse<?> saveSelf(@RequestBody Map<String, Object> body, @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return interests.save(user, user.getId(), body) ? ApiResponse.ok("OK") : ApiResponse.fail("Không lưu được");
    }
}
