package com.anylearn.backend.controller.fun;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.sticker.StickerMarketService;
import com.anylearn.backend.service.sticker.StickerService;
import com.anylearn.backend.service.sticker.StickerTradeService;
import com.anylearn.backend.service.sticker.WelcomePackService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** The sticker album and trades of the Vui học page (plan 14, phase 3). Login needed. */
@RestController
@RequestMapping("/api/stickers")
@RequiredArgsConstructor
public class StickerController {

    private final StickerService stickers;
    private final StickerTradeService trades;
    private final StickerMarketService market;
    private final WelcomePackService welcomePacks;

    private static long id(Object value) {
        if (value instanceof Number n) return n.longValue();
        throw new IllegalStateException("Thiếu thông tin sticker");
    }

    @GetMapping
    public ApiResponse<?> album(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        Map<String, Object> out = new LinkedHashMap<>(stickers.album(user.getId()));
        out.putAll(welcomePacks.summaryOf(user.getId()));
        out.putAll(trades.offersOf(user.getId()));
        return ApiResponse.ok(out);
    }

    @PostMapping("/offers")
    public ApiResponse<?> offer(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        try {
            return ApiResponse.ok(trades.offer(user.getId(), body.get("toPhone") instanceof String s ? s : null, id(body.get("giveId")), id(body.get("wantId"))));
        } catch (IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @PostMapping("/offers/{offerId}/accept")
    public ApiResponse<?> accept(@AuthenticationPrincipal User user, @PathVariable long offerId) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        try {
            return ApiResponse.ok(trades.accept(user.getId(), offerId));
        } catch (IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @PostMapping("/offers/{offerId}/decline")
    public ApiResponse<?> decline(@AuthenticationPrincipal User user, @PathVariable long offerId) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        try {
            trades.decline(user.getId(), offerId);
            return ApiResponse.ok(Map.of("ok", true));
        } catch (IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @PostMapping("/offers/{offerId}/cancel")
    public ApiResponse<?> cancel(@AuthenticationPrincipal User user, @PathVariable long offerId) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        try {
            trades.cancel(user.getId(), offerId);
            return ApiResponse.ok(Map.of("ok", true));
        } catch (IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @GetMapping("/market")
    public ApiResponse<?> marketList(@AuthenticationPrincipal User user, @RequestParam(defaultValue = "match") String tab, @RequestParam(defaultValue = "1") int page) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        return ApiResponse.ok(market.list(user.getId(), tab, page));
    }

    @PostMapping("/market")
    public ApiResponse<?> marketCreate(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        try {
            List<Long> give = new ArrayList<>();
            if (body.get("give") instanceof List<?> list) for (Object o : list) give.add(id(o));
            return ApiResponse.ok(market.create(user.getId(), give, id(body.get("want"))));
        } catch (IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @PostMapping("/market/{listingId}/take")
    public ApiResponse<?> marketTake(@AuthenticationPrincipal User user, @PathVariable long listingId, @RequestBody Map<String, Object> body) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        try {
            return ApiResponse.ok(market.take(user.getId(), listingId, id(body.get("stickerId"))));
        } catch (IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @DeleteMapping("/market/{listingId}")
    public ApiResponse<?> marketRemove(@AuthenticationPrincipal User user, @PathVariable long listingId) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        try {
            market.remove(user.getId(), listingId);
            return ApiResponse.ok(Map.of("ok", true));
        } catch (IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @PostMapping("/set-reward")
    public ApiResponse<?> setReward(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (user == null) return ApiResponse.fail("Unauthorized");
        if (!(body.get("collectionId") instanceof Number collectionId)) return ApiResponse.fail("Thiếu bộ sưu tập");
        try {
            return ApiResponse.ok(stickers.claimSetReward(user.getId(), collectionId.longValue()));
        } catch (IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }
}
