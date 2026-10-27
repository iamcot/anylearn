package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.recommend.PathwayService;
import com.anylearn.backend.service.recommend.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** Back office of plan 08: pathways (the course picker is `/admin/collections/course-search`) and the suggestion report. */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminPathwayController {

    private final PathwayService pathwayService;
    private final RecommendationService recommendationService;

    @GetMapping("/pathways")
    public ApiResponse<?> list(@AuthenticationPrincipal User user) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(pathwayService.listForAdmin());
    }

    @GetMapping("/pathways/{id}")
    public ApiResponse<?> get(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return pathwayService.getForAdmin(id).<ApiResponse<?>>map(ApiResponse::ok).orElseGet(() -> ApiResponse.fail("Không tìm thấy lộ trình"));
    }

    @PostMapping("/pathways")
    public ApiResponse<?> create(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return save(user, null, body);
    }

    @PutMapping("/pathways/{id}")
    public ApiResponse<?> update(@AuthenticationPrincipal User user, @PathVariable Long id, @RequestBody Map<String, Object> body) {
        return save(user, id, body);
    }

    @DeleteMapping("/pathways/{id}")
    public ApiResponse<?> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        pathwayService.delete(id);
        return ApiResponse.ok("Deleted");
    }

    /** Views, clicks and orders per kind of suggestion; `from`/`to` default to the last 30 days. */
    @GetMapping("/recommendations/stats")
    public ApiResponse<?> stats(@AuthenticationPrincipal User user, @RequestParam(required = false) String from, @RequestParam(required = false) String to) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        LocalDate end = to == null || to.isBlank() ? LocalDate.now() : LocalDate.parse(to.substring(0, 10));
        LocalDate start = from == null || from.isBlank() ? end.minusDays(29) : LocalDate.parse(from.substring(0, 10));
        return ApiResponse.ok(recommendationService.stats(start, end));
    }

    private ApiResponse<?> save(User user, Long id, Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        try {
            List<PathwayService.Step> steps = body.get("steps") instanceof List<?> list ? list.stream()
                    .filter(Map.class::isInstance).map(o -> (Map<?, ?>) o)
                    .map(m -> new PathwayService.Step(m.get("itemId") instanceof Number n ? n.longValue() : null,
                            m.get("note") instanceof String s ? s : null)).toList() : null;
            var draft = new PathwayService.Draft(text(body, "title"), text(body, "slug"), text(body, "subtitle"), text(body, "cover"),
                    body.get("partnerId") instanceof Number n ? n.longValue() : null,
                    body.get("active") instanceof Boolean b ? b : null, steps);
            return ApiResponse.ok(Map.of("id", pathwayService.save(id, draft)));
        } catch (IllegalArgumentException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    private static String text(Map<String, Object> body, String key) {
        return body.get(key) instanceof String s ? s : null;
    }

    private static boolean isAdmin(User user) {
        return user != null && "admin".equals(user.getRole());
    }
}
