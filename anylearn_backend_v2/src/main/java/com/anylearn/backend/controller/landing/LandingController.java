package com.anylearn.backend.controller.landing;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.service.landing.LandingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Public: the landing page "/hoc/{môn}/{tuổi}-tuoi/{quận}" (plan 19.A7). Unknown, switched off or under 3 courses = fail (the site answers 404). */
@RestController
@RequestMapping("/api/landing")
@RequiredArgsConstructor
public class LandingController {

    private final LandingService landing;

    @GetMapping
    public ApiResponse<?> page(@RequestParam String path) {
        Map<String, Object> page = landing.publicPage(path);
        return page == null ? ApiResponse.fail("Trang không tồn tại") : ApiResponse.ok(page);
    }
}
