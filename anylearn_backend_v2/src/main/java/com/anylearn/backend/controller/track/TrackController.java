package com.anylearn.backend.controller.track;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.service.acquisition.AcquisitionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Public: the site reports an arrival with UTM parameters (plan 19.A4). Limited per IP, never an error for the browser. */
@RestController
@RequestMapping("/api/track")
@RequiredArgsConstructor
public class TrackController {

    private final AcquisitionService acquisition;

    @PostMapping("/landing")
    public ApiResponse<?> landing(@RequestBody(required = false) Map<String, Object> body, HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        String ip = forwarded != null && !forwarded.isBlank() ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
        return ApiResponse.ok(Map.of("counted", acquisition.trackLanding(body, ip)));
    }
}
