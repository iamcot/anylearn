package com.anylearn.backend.controller.fun;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.farm.FarmService;
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
}
