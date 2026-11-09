package com.anylearn.backend.controller.fun;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.farm.FarmProgressService;
import com.anylearn.backend.service.farm.FarmService;
import com.anylearn.backend.service.farm.FarmSocialService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/** Nông trại anyLEARN (plan 22). Login needed; the path follows the access mode of the game `farm`. */
@RestController
@RequestMapping("/api/farm")
@RequiredArgsConstructor
public class FarmController {

    private final FarmService farm;
    private final FarmProgressService progress;
    private final FarmSocialService social;

    private ApiResponse<?> run(User user, Supplier<Object> action) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        try {
            return ApiResponse.ok(action.get());
        } catch (IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    private static List<Integer> slots(Map<String, Object> body) {
        if (!(body.get("slots") instanceof List<?> list)) return List.of();
        return list.stream().filter(o -> o instanceof Number).map(o -> ((Number) o).intValue()).toList();
    }

    @GetMapping
    public ApiResponse<?> view(@AuthenticationPrincipal User user) {
        return run(user, () -> farm.view(user.getId()));
    }

    @PostMapping("/plant")
    public ApiResponse<?> plant(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return run(user, () -> farm.plant(user.getId(), ((Number) body.getOrDefault("slot", -1)).intValue(), String.valueOf(body.get("cropKey"))));
    }

    @PostMapping("/water")
    public ApiResponse<?> water(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return run(user, () -> farm.water(user.getId(), slots(body)));
    }

    @PostMapping("/fertilize")
    public ApiResponse<?> fertilize(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return run(user, () -> farm.fertilize(user.getId(), ((Number) body.getOrDefault("slot", -1)).intValue()));
    }

    @PostMapping("/buy-fertilizer")
    public ApiResponse<?> buyFertilizer(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return run(user, () -> farm.buyFertilizer(user.getId(), ((Number) body.getOrDefault("qty", 1)).intValue()));
    }

    @PostMapping("/harvest")
    public ApiResponse<?> harvest(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return run(user, () -> farm.harvest(user.getId(), slots(body)));
    }

    @PostMapping("/sell")
    public ApiResponse<?> sell(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return run(user, () -> {
            Map<String, Integer> items = new java.util.LinkedHashMap<>();
            if (body.get("items") instanceof Map<?, ?> m) m.forEach((k, v) -> { if (v instanceof Number n) items.put(String.valueOf(k), n.intValue()); });
            return farm.sell(user.getId(), items);
        });
    }

    private static long num(Map<String, Object> body, String key) {
        return body.get(key) instanceof Number n ? n.longValue() : -1;
    }

    // ---- 22.3: compost, plots, orders, tasks, chapters ----

    @GetMapping("/progress")
    public ApiResponse<?> progress(@AuthenticationPrincipal User user) {
        return run(user, () -> progress.progress(user.getId()));
    }

    @PostMapping("/compost")
    public ApiResponse<?> compost(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return run(user, () -> progress.startCompost(user.getId(), String.valueOf(body.get("cropKey"))));
    }

    @PostMapping("/compost/collect")
    public ApiResponse<?> collectCompost(@AuthenticationPrincipal User user) {
        return run(user, () -> progress.collectCompost(user.getId()));
    }

    @PostMapping("/expand")
    public ApiResponse<?> expand(@AuthenticationPrincipal User user) {
        return run(user, () -> progress.expand(user.getId()));
    }

    @PostMapping("/orders/{id}/deliver")
    public ApiResponse<?> deliver(@AuthenticationPrincipal User user, @PathVariable long id) {
        return run(user, () -> progress.deliver(user.getId(), id));
    }

    @PostMapping("/orders/{id}/skip")
    public ApiResponse<?> skip(@AuthenticationPrincipal User user, @PathVariable long id) {
        return run(user, () -> progress.skipOrder(user.getId(), id));
    }

    @PostMapping("/tasks/{index}/claim")
    public ApiResponse<?> claimTask(@AuthenticationPrincipal User user, @PathVariable int index) {
        return run(user, () -> progress.claimTask(user.getId(), index));
    }

    @PostMapping("/tasks/box")
    public ApiResponse<?> claimBox(@AuthenticationPrincipal User user) {
        return run(user, () -> progress.claimTaskBox(user.getId()));
    }

    @PostMapping("/chapters/{no}/claim")
    public ApiResponse<?> claimChapter(@AuthenticationPrincipal User user, @PathVariable int no) {
        return run(user, () -> progress.claimChapter(user.getId(), no));
    }

    // ---- 22.5: neighbours ----

    @GetMapping("/neighbors")
    public ApiResponse<?> neighbors(@AuthenticationPrincipal User user) {
        return run(user, () -> Map.of("neighbors", social.list(user.getId()), "suggestions", social.suggestions(user.getId()), "today", social.todaySummary(user.getId())));
    }

    @PostMapping("/neighbors")
    public ApiResponse<?> addNeighbor(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return run(user, () -> social.add(user.getId(), String.valueOf(body.get("code"))));
    }

    @DeleteMapping("/neighbors/{id}")
    public ApiResponse<?> removeNeighbor(@AuthenticationPrincipal User user, @PathVariable long id) {
        return run(user, () -> social.remove(user.getId(), id));
    }

    @GetMapping("/visit/{ownerId}")
    public ApiResponse<?> visit(@AuthenticationPrincipal User user, @PathVariable long ownerId) {
        return run(user, () -> social.visit(user.getId(), ownerId));
    }

    @PostMapping("/visit/{ownerId}/water")
    public ApiResponse<?> waterFor(@AuthenticationPrincipal User user, @PathVariable long ownerId, @RequestBody Map<String, Object> body) {
        return run(user, () -> social.water(user.getId(), ownerId, slots(body)));
    }

    @PostMapping("/visit/{ownerId}/fertilize")
    public ApiResponse<?> fertilizeFor(@AuthenticationPrincipal User user, @PathVariable long ownerId, @RequestBody Map<String, Object> body) {
        return run(user, () -> social.fertilize(user.getId(), ownerId, (int) num(body, "slot")));
    }

    @PostMapping("/visit/{ownerId}/steal")
    public ApiResponse<?> steal(@AuthenticationPrincipal User user, @PathVariable long ownerId, @RequestBody Map<String, Object> body) {
        return run(user, () -> social.steal(user.getId(), ownerId, (int) num(body, "slot")));
    }

    @PutMapping("/prefs")
    public ApiResponse<?> prefs(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return run(user, () -> social.setAllowSteal(user.getId(), !Boolean.FALSE.equals(body.get("allowSteal"))));
    }
}
