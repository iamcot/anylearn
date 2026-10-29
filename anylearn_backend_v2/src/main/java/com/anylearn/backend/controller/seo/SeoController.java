package com.anylearn.backend.controller.seo;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.service.seo.SeoRules;
import com.anylearn.backend.service.seo.SitemapService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Public: what the site's sitemap.xml lists (plan 19.A1). */
@RestController
@RequestMapping("/api/seo")
@RequiredArgsConstructor
public class SeoController {

    private final SitemapService sitemap;

    /** No type = counts per type; with a type = one file of `{type, id, slug, updatedAt}` rows. */
    @GetMapping("/sitemap")
    public ApiResponse<?> sitemap(@RequestParam(required = false) String type, @RequestParam(defaultValue = "1") int page) {
        if (type == null || type.isBlank()) return ApiResponse.ok(sitemap.summary());
        if (!SeoRules.knownType(type)) return ApiResponse.fail("Loại link không hợp lệ");
        return ApiResponse.ok(Map.of("type", type, "page", Math.max(page, 1), "items", sitemap.page(type, page)));
    }
}
