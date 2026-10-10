package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.TransactionRepository;
import com.anylearn.backend.service.WalletService;
import com.anylearn.backend.service.payment.PaymentApprovalService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/transactions")
@RequiredArgsConstructor
public class AdminTransactionController {

    private final TransactionRepository transactionRepository;
    private final WalletService walletService;
    private final PaymentApprovalService paymentApprovalService;
    private final EntityManager em;

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
            @RequestParam(required = false) String phone,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");

        String safeSort = "asc".equalsIgnoreCase(sortDir) ? "ASC" : "DESC";
        StringBuilder conditions = new StringBuilder();
        if (userId != null) conditions.append(" AND t.user_id=").append(userId);
        if (type != null && !type.isBlank()) conditions.append(" AND t.type='").append(type.replace("'", "''")).append("'");
        if (status != null) conditions.append(" AND t.status=").append(status);
        if (phone != null && !phone.isBlank()) {
            String safePhone = phone.replace("'", "''");
            conditions.append(" AND u.phone LIKE '%").append(safePhone).append("%'");
        }

        String dataSQL = "SELECT t.id, t.user_id, t.ref_user_id, t.type, t.amount, t.pay_method, " +
                "t.content, t.status, t.order_id, t.created_at, " +
                "u.name AS userName, u.phone AS userPhone " +
                "FROM transactions t " +
                "LEFT JOIN users u ON t.user_id = u.id " +
                "WHERE 1=1" + conditions +
                " ORDER BY t.id " + safeSort +
                " LIMIT " + size + " OFFSET " + ((long) page * size);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(dataSQL).getResultList();

        List<Map<String, Object>> content = new ArrayList<>();
        for (Object[] row : rows) {
            var m = new LinkedHashMap<String, Object>();
            m.put("id", row[0]);
            m.put("userId", row[1]);
            m.put("refUserId", row[2]);
            m.put("type", row[3]);
            m.put("amount", row[4]);
            m.put("payMethod", row[5]);
            m.put("content", row[6]);
            m.put("status", row[7]);
            m.put("orderId", row[8]);
            m.put("createdAt", row[9] != null ? row[9].toString() : null);
            m.put("userName", row[10]);
            m.put("userPhone", row[11]);
            content.add(m);
        }

        String countSQL = "SELECT COUNT(*) FROM transactions t " +
                "LEFT JOIN users u ON t.user_id = u.id " +
                "WHERE 1=1" + conditions;

        Number countResult = (Number) em.createNativeQuery(countSQL).getSingleResult();
        long total = countResult.longValue();

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
