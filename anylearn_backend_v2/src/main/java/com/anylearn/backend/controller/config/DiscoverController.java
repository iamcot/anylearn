package com.anylearn.backend.controller.config;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.service.ConfigService;
import com.anylearn.backend.service.MeilisearchService;
import com.anylearn.backend.service.search.DailyShuffle;
import com.anylearn.backend.service.search.SearchFilters;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** "Thử điều mới cho con": courses that fit the child, nearer ones first, in a random order that stays the same for the day. */
@RestController
@RequestMapping("/api/discover")
@RequiredArgsConstructor
public class DiscoverController {

    private static final int POOL_SIZE = 200;
    private static final int MAX_PAGE_SIZE = 24;
    // Courses are shuffled inside groups of this size, nearest group first (two pages of 12).
    private static final int BAND_SIZE = 24;

    private final MeilisearchService meilisearchService;
    private final ConfigService configService;

    @GetMapping
    public ApiResponse<?> discover(@RequestParam(required = false) Integer ageFrom,
                                   @RequestParam(required = false) Integer ageTo,
                                   @RequestParam(required = false) String location,
                                   @RequestParam(required = false) Double nearLat,
                                   @RequestParam(required = false) Double nearLng,
                                   @RequestParam(required = false) String seed,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "12") int pageSize) {
        // The position only orders the list (near first); it never hides a course.
        var filters = SearchFilters.Builder.empty().provinceCode(location).learnerAge(ageFrom, ageTo)
                .today(LocalDate.now()).build();
        List<Long> pool = meilisearchService.searchIds("", POOL_SIZE, filters, nearLat, nearLng);
        // The same child sees the same list all day; tomorrow it is a new one.
        String dailySeed = LocalDate.now() + "|" + (seed == null ? "" : seed) + "|" + ageFrom + "|" + ageTo;
        List<Long> shuffled = DailyShuffle.shuffleInBands(pool, BAND_SIZE, dailySeed);
        List<Long> ids = DailyShuffle.page(shuffled, page, Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE));
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("items", configService.getItemsByIds(ids));
        response.put("total", shuffled.size());
        response.put("page", page);
        response.put("pageSize", pageSize);
        return ApiResponse.ok(response);
    }
}
