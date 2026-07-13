package com.anylearn.backend.controller.cart;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping("/cart-info/{itemId}")
    public ApiResponse<?> cartInfo(@PathVariable Long itemId,
                                   @AuthenticationPrincipal User user) {
        return ApiResponse.ok(cartService.getCartInfo(itemId, user));
    }

    @PostMapping("/cart/add")
    public ApiResponse<?> addToCart(@RequestBody Map<String, Object> body,
                                    @AuthenticationPrincipal User user) {
        Long itemId = Long.parseLong(String.valueOf(body.get("itemId")));
        Long studentId = body.get("studentId") != null ? Long.parseLong(String.valueOf(body.get("studentId"))) : null;
        Long planId = body.get("planId") != null ? Long.parseLong(String.valueOf(body.get("planId"))) : null;
        String trialType = (String) body.get("trialType");
        String trialDate = (String) body.get("trialDate");
        String trialNote = (String) body.get("trialNote");
        return ApiResponse.ok(cartService.addToCart(itemId, studentId, planId, trialType, trialDate, trialNote, user));
    }

    @GetMapping("/cart")
    public ApiResponse<?> getCart(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(cartService.getCart(user));
    }

    @DeleteMapping("/cart/{actionId}")
    public ApiResponse<?> removeCartItem(@PathVariable Long actionId,
                                         @AuthenticationPrincipal User user) {
        cartService.removeCartItem(actionId, user);
        return ApiResponse.ok("Đã xóa");
    }

    @PostMapping("/checkout")
    public ApiResponse<?> checkout(@RequestBody Map<String, Object> body,
                                   @AuthenticationPrincipal User user) {
        String paymentMethod = (String) body.get("paymentMethod");
        String couponCode = (String) body.get("couponCode");
        Integer pointsUsed = body.get("pointsUsed") != null
                ? Integer.parseInt(String.valueOf(body.get("pointsUsed"))) : null;
        return ApiResponse.ok(cartService.checkout(paymentMethod, couponCode, pointsUsed, user));
    }

    @GetMapping("/order/{orderId}")
    public ApiResponse<?> getOrder(@PathVariable String orderId,
                                   @AuthenticationPrincipal User user) {
        return ApiResponse.ok(cartService.getOrder(orderId, user));
    }
}
