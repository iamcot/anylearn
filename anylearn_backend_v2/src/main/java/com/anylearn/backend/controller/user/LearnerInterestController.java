package com.anylearn.backend.controller.user;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.interests.LearnerInterestService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user/children/{childId}/interests")
@RequiredArgsConstructor
public class LearnerInterestController {

    private final LearnerInterestService interests;

    @GetMapping
    public ApiResponse<?> get(@PathVariable Long childId, @AuthenticationPrincipal User user) {
        Map<String, Object> answers = interests.get(user, childId);
        return answers == null ? ApiResponse.fail("Không tìm thấy tài khoản con") : ApiResponse.ok(answers);
    }

    /** Body: {likes: [keys], wants: [keys], budget: key}. Everything is optional; it replaces the earlier answers. */
    @PutMapping
    public ApiResponse<?> save(@PathVariable Long childId, @RequestBody Map<String, Object> body, @AuthenticationPrincipal User user) {
        return interests.save(user, childId, body) ? ApiResponse.ok("OK") : ApiResponse.fail("Không tìm thấy tài khoản con");
    }
}
