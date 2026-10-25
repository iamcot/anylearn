package com.anylearn.backend.controller.user;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.pricing.PriceReportInput;
import com.anylearn.backend.service.pricing.PriceReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// "Thấy giá rẻ hơn ở nơi khác? Báo cho chúng tôi": open to visitors without an account (they leave a phone number).
@RestController
@RequestMapping("/api/price-reports")
@RequiredArgsConstructor
public class PriceReportController {

    private final PriceReportService service;

    @PostMapping
    public ApiResponse<?> create(@RequestBody PriceReportInput input, @AuthenticationPrincipal User user) {
        var report = service.create(input, user != null ? user.getId() : null);
        return ApiResponse.ok(Map.of("id", report.getId()));
    }
}
