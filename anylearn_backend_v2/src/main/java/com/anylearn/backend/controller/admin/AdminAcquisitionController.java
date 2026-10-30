package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.acquisition.AcquisitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Back office page "Nguồn khách" (plan 19.A4). */
@RestController
@RequestMapping("/admin/acquisition")
@RequiredArgsConstructor
public class AdminAcquisitionController {

    private final AcquisitionService acquisition;

    @GetMapping
    public ApiResponse<?> report(@AuthenticationPrincipal User user, @RequestParam(defaultValue = "30") int days) {
        if (user == null || !"admin".equals(user.getRole())) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(acquisition.report(days));
    }
}
