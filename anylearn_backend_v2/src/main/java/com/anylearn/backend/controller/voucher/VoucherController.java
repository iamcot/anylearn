package com.anylearn.backend.controller.voucher;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.CartService;
import com.anylearn.backend.service.voucher.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/** Voucher wallet (plan 20). Everything needs a login except the list of vouchers people can collect. */
@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService vouchers;
    private final CartService cart;

    /** The wallet, newest first: state active / used / expired. */
    @GetMapping("/wallet")
    public ApiResponse<?> wallet(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Cần đăng nhập");
        return ApiResponse.ok(Map.of("items", vouchers.wallet(user.getId(), null), "active", vouchers.activeCount(user.getId())));
    }

    /** The wallet checked against the current cart: every active row has discount and problem (null = usable). */
    @GetMapping("/for-cart")
    public ApiResponse<?> forCart(@AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Cần đăng nhập");
        return ApiResponse.ok(Map.of("items", vouchers.wallet(user.getId(), cart.voucherLines(user))));
    }

    /** A typed code (or a wallet row) checked against the current cart. Nothing is saved. */
    @GetMapping("/quote")
    public ApiResponse<?> quote(@RequestParam(required = false) String code, @RequestParam(required = false) Long walletId,
                                @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Cần đăng nhập");
        VoucherService.Quote q = vouchers.quote(code, walletId, user.getId(), cart.voucherLines(user));
        if (!q.ok()) return ApiResponse.fail(q.problem() != null ? q.problem() : "Mã khuyến mãi không hợp lệ");
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", q.code());
        m.put("walletId", q.walletId());
        m.put("title", q.title());
        m.put("discountValue", q.discount());
        m.put("message", "Áp dụng thành công! Giảm " + com.anylearn.backend.service.voucher.VoucherRules.money(q.discount()));
        return ApiResponse.ok(m);
    }

    /** Save a typed code into the wallet. */
    @PostMapping("/add")
    public ApiResponse<?> add(@RequestBody Map<String, Object> body, @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Cần đăng nhập");
        return ApiResponse.ok(vouchers.addCode(user.getId(), String.valueOf(body.getOrDefault("code", ""))));
    }

    /** Vouchers people can collect themselves (public; collected = the caller already has it). */
    @GetMapping("/collectible")
    public ApiResponse<?> collectible(@RequestParam(required = false) String place, @RequestParam(required = false) Long partnerId,
                                      @RequestParam(required = false) Long itemId, @AuthenticationPrincipal User user) {
        return ApiResponse.ok(vouchers.collectible(user != null ? user.getId() : null, place, partnerId, itemId));
    }

    @PostMapping("/collect")
    public ApiResponse<?> collect(@RequestBody Map<String, Object> body, @AuthenticationPrincipal User user) {
        if (user == null) return ApiResponse.fail("Cần đăng nhập");
        Object g = body.get("groupId");
        if (g == null) return ApiResponse.fail("Thiếu voucher");
        return ApiResponse.ok(vouchers.collect(user.getId(), Long.parseLong(String.valueOf(g))));
    }
}
