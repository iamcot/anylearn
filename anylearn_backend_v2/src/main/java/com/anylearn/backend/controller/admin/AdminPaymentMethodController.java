package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.payment.PaymentMethodService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Back office page "Phương thức thanh toán": switch methods on or off and set the order totals between which one shows. */
@RestController
@RequestMapping("/admin/payment-methods")
@RequiredArgsConstructor
public class AdminPaymentMethodController {

    private final PaymentMethodService paymentMethods;

    @GetMapping
    public ApiResponse<?> list(@AuthenticationPrincipal User user) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(paymentMethods.listForAdmin());
    }

    @PutMapping
    public ApiResponse<?> save(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        if (!(body.get("methods") instanceof List<?> list)) return ApiResponse.fail("Thiếu danh sách phương thức");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) list;
        String problem = paymentMethods.save(rows);
        return problem == null ? ApiResponse.ok(paymentMethods.listForAdmin()) : ApiResponse.fail(problem);
    }

    private boolean isAdmin(User user) {
        return user != null && "admin".equals(user.getRole());
    }
}
