package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.Transaction;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.TransactionRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.WalletService;
import com.anylearn.backend.service.payment.PaymentApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/transactions")
@RequiredArgsConstructor
public class AdminTransactionController {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final WalletService walletService;
    private final PaymentApprovalService paymentApprovalService;

    private boolean isAdmin(User user) {
        return user != null && "admin".equals(user.getRole());
    }

    // ── List ──────────────────────────────────────────────────────────────────

    @GetMapping
    public ApiResponse<?> list(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");

        var rows = transactionRepository.findForAdmin(userId, type, status, size, (long) page * size);
        var content = rows.stream().map(t -> {
            var m = new LinkedHashMap<String, Object>();
            m.put("id", t.getId()); m.put("userId", t.getUserId());
            // Enrich with user name + phone
            userRepository.findById(t.getUserId()).ifPresent(u -> {
                m.put("userName", u.getName() != null ? u.getName() : u.getPhone());
                m.put("userPhone", u.getPhone());
            });
            m.put("refUserId", t.getRefUserId());
            m.put("type", t.getType()); m.put("amount", t.getAmount());
            m.put("payMethod", t.getPayMethod()); m.put("content", t.getContent());
            m.put("status", t.getStatus()); m.put("orderId", t.getOrderId());
            m.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : null);
            return m;
        }).toList();

        long total = transactionRepository.countForAdmin(userId, type, status);

        return ApiResponse.ok(Map.of("content", content, "total", total, "page", page, "size", size));
    }

    // ── Approve ────────────────────────────────────────────────────────────────

    @PutMapping("/{id:\\d+}/approve")
    public ApiResponse<?> approve(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return transactionRepository.findById(id).map(tx -> {
            if (tx.getStatus() != 0) return ApiResponse.fail("Transaction đã được xử lý (status=" + tx.getStatus() + ")");

            tx.setStatus(1);
            tx.setUpdatedAt(LocalDateTime.now());
            transactionRepository.save(tx);

            // Credit wallet_c only for types that reward a user
            // foundation + net_revenue are accounting-only — no wallet_c credit
            if ("commission".equals(tx.getType()) || "partner".equals(tx.getType()) || "commission_add".equals(tx.getType())) {
                walletService.creditWalletC(tx.getUserId(), tx.getAmount());
            }

            return ApiResponse.ok(Map.of("id", tx.getId(), "status", 1));
        }).orElse(ApiResponse.fail("Không tìm thấy transaction"));
    }

    // ── Reject ────────────────────────────────────────────────────────────────

    @PutMapping("/{id:\\d+}/reject")
    public ApiResponse<?> reject(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return transactionRepository.findById(id).map(tx -> {
            if (tx.getStatus() != 0) return ApiResponse.fail("Transaction đã được xử lý (status=" + tx.getStatus() + ")");

            tx.setStatus(99);
            tx.setUpdatedAt(LocalDateTime.now());
            transactionRepository.save(tx);

            // Refund wallet_c for withdraw requests that were rejected
            if ("withdraw".equals(tx.getType())) {
                walletService.creditWalletC(tx.getUserId(), Math.abs(tx.getAmount()));
            }

            return ApiResponse.ok(Map.of("id", tx.getId(), "status", 99));
        }).orElse(ApiResponse.fail("Không tìm thấy transaction"));
    }
}
