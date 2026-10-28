package com.anylearn.backend.controller.fun;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.shop.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** The Leo Xu shop (plan 15): the one catalog, buying and selling back. Login needed for everything. */
@RestController
@RequestMapping("/api/shop")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shop;

    private interface Call {
        Object run() throws RuntimeException;
    }

    private static ApiResponse<?> guarded(User user, Call call) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        try {
            return ApiResponse.ok(call.run());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    /** Catalog with prices and today's limits, what the person can sell, the balance and the energy bar. */
    @GetMapping
    public ApiResponse<?> overview(@AuthenticationPrincipal User user) {
        return guarded(user, () -> shop.overview(user.getId()));
    }

    /** Body {key, difficulty?}: a quiz item key, pack_level / pack_topic / pack_topic_level (level for the first and last), energy, chest_normal, chest_rare. */
    @PostMapping("/buy")
    public ApiResponse<?> buy(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return guarded(user, () -> shop.buy(user.getId(), body.get("key") == null ? null : body.get("key").toString(),
                body.get("difficulty") instanceof Number n ? Integer.valueOf(n.intValue()) : null));
    }

    /** Body {kind: sticker|item, id}: the sticker id or the quiz item key. */
    @PostMapping("/sell")
    public ApiResponse<?> sell(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        return guarded(user, () -> shop.sell(user.getId(), body.get("kind") == null ? null : body.get("kind").toString(),
                body.get("id") == null ? null : body.get("id").toString()));
    }
}
