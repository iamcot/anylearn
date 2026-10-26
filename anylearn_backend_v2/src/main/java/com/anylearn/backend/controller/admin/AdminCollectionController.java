package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.MeilisearchService;
import com.anylearn.backend.service.collections.CollectionService;
import com.anylearn.backend.service.search.SearchFilters;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/collections")
@RequiredArgsConstructor
public class AdminCollectionController {

    private final CollectionService collectionService;
    private final MeilisearchService meilisearchService;

    @GetMapping
    public ApiResponse<?> list(@AuthenticationPrincipal User user) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(collectionService.listForAdmin());
    }

    @GetMapping("/{id}")
    public ApiResponse<?> get(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return collectionService.getForAdmin(id).<ApiResponse<?>>map(ApiResponse::ok)
                .orElseGet(() -> ApiResponse.fail("Không tìm thấy bộ sưu tập"));
    }

    @PostMapping
    public ApiResponse<?> create(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return save(user, null, body);
    }

    @PutMapping("/{id}")
    public ApiResponse<?> update(@AuthenticationPrincipal User user, @PathVariable Long id, @RequestBody Map<String, Object> body) {
        return save(user, id, body);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        collectionService.delete(id);
        return ApiResponse.ok("Deleted");
    }

    /**
     * Courses to add to a collection: the same search the visitors use, so "Gợi ý" with filters and a plain keyword
     * search are one call. Only courses that are switched on come back.
     */
    @GetMapping("/course-search")
    public ApiResponse<?> courseSearch(@AuthenticationPrincipal User user,
                                       @RequestParam(required = false) String q,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "30") int pageSize,
                                       @RequestParam(required = false) String sort,
                                       @RequestParam(required = false) Integer ageFrom,
                                       @RequestParam(required = false) Integer ageTo,
                                       @RequestParam(required = false) String location,
                                       @RequestParam(required = false) String district,
                                       @RequestParam(required = false) String partnerType,
                                       @RequestParam(required = false) List<String> timeSlot,
                                       @RequestParam(required = false) List<Long> tag,
                                       @RequestParam(required = false) Long priceMax,
                                       @RequestParam(required = false) String mode,
                                       @RequestParam(defaultValue = "false") boolean freeTrial,
                                       @RequestParam(defaultValue = "false") boolean onSale) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        var filters = SearchFilters.Builder.empty().provinceCode(location).districtCode(district).mode(mode)
                .learnerAge(ageFrom, ageTo).timeSlots(timeSlot == null ? List.of() : timeSlot).partnerType(partnerType)
                .tags(tag == null ? List.of() : tag).price(null, priceMax).today(LocalDate.now());
        if (freeTrial) filters.freeTrial();
        if (onSale) filters.onSale();
        return ApiResponse.ok(meilisearchService.search(q, page, Math.min(pageSize, 60), sort, filters.build()));
    }

    private ApiResponse<?> save(User user, Long id, Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        try {
            var draft = new CollectionService.Draft(text(body, "title"), text(body, "slug"), text(body, "subtitle"), text(body, "cover"),
                    date(body, "seasonFrom"), date(body, "seasonTo"),
                    body.get("sortOrder") instanceof Number n ? n.intValue() : null,
                    body.get("active") instanceof Boolean b ? b : null,
                    body.get("itemIds") instanceof List<?> list ? list.stream().filter(Number.class::isInstance).map(o -> ((Number) o).longValue()).toList() : null);
            return ApiResponse.ok(Map.of("id", collectionService.save(id, draft).getId()));
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    private static String text(Map<String, Object> body, String key) {
        return body.get(key) instanceof String s ? s : null;
    }

    private static LocalDate date(Map<String, Object> body, String key) {
        String value = text(body, key);
        return value == null || value.isBlank() ? null : LocalDate.parse(value.substring(0, 10));
    }

    private static boolean isAdmin(User user) {
        return user != null && "admin".equals(user.getRole());
    }
}
