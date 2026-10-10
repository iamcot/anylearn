package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.OrderRepository;
import com.anylearn.backend.service.payment.PaymentApprovalService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderRepository orderRepository;
    private final PaymentApprovalService paymentApprovalService;
    private final EntityManager em;

    private boolean isAdmin(User user) {
        return user != null && "admin".equals(user.getRole());
    }

    @GetMapping
    public ApiResponse<?> list(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String payment,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long partnerId,
            @RequestParam(defaultValue = "desc") String sortDir) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");

        String safeSort = "asc".equalsIgnoreCase(sortDir) ? "ASC" : "DESC";

        var conditions =
                  (status != null && !status.isBlank() ? " AND o.status='" + status.replace("'","''") + "'" : "") +
                  (payment != null && !payment.isBlank() ? " AND o.payment='" + payment.replace("'","''") + "'" : "") +
                  (q != null && !q.isBlank() ? " AND (u.name LIKE '%" + q.replace("'","''") + "%' OR u.phone LIKE '%" + q.replace("'","''") + "%')" : "") +
                  (partnerId != null ? " AND pu.id=" + partnerId : "");

        var baseSql = "FROM orders o " +
                  "LEFT JOIN users u ON o.user_id = u.id " +
                  "LEFT JOIN order_details od ON od.order_id = o.id " +
                  "LEFT JOIN items i ON od.item_id = i.id " +
                  "LEFT JOIN users pu ON i.user_id = pu.id " +
                  "WHERE 1=1" + conditions;

        var sql = "SELECT o.id, o.amount, o.status, o.payment, o.created_at, u.name AS buyerName, u.phone AS buyerPhone, " +
                  "GROUP_CONCAT(DISTINCT pu.name SEPARATOR ', ') AS partnerNames, " +
                  "GROUP_CONCAT(DISTINCT pu.id SEPARATOR ',') AS partnerIds " +
                  baseSql +
                  " GROUP BY o.id, o.status, o.payment, o.amount, o.created_at, u.name, u.phone" +
                  " ORDER BY o.id " + safeSort +
                  " LIMIT " + size + " OFFSET " + (long) page * size;

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();

        var content = rows.stream().map(r -> {
            var m = new LinkedHashMap<String, Object>();
            m.put("id", r[0]); m.put("amount", r[1]); m.put("status", r[2] != null ? r[2] : "");
            m.put("payment", r[3] != null ? r[3] : ""); m.put("createdAt", r[4] != null ? r[4].toString() : "");
            m.put("buyerName", r[5] != null ? r[5] : ""); m.put("buyerPhone", r[6] != null ? r[6] : "");
            m.put("partnerNames", r[7] != null ? r[7] : "");
            m.put("partnerIds", r[8] != null ? r[8] : "");
            return m;
        }).toList();

        long total = ((Number) em.createNativeQuery(
                "SELECT COUNT(*) FROM (" +
                "SELECT o.id " + baseSql + " GROUP BY o.id" +
                ") t")
                .getSingleResult()).longValue();

        return ApiResponse.ok(Map.of("content", content, "total", total, "page", page, "size", size));
    }

    @GetMapping("/{id}")
    public ApiResponse<?> detail(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");

        @SuppressWarnings("unchecked")
        List<Object[]> details = em.createNativeQuery(
                "SELECT od.id, od.item_id, i.title, od.unit_price, od.paid_price, od.status, " +
                "u.name AS studentName, u.is_child, partner.name AS ownerName " +
                "FROM order_details od JOIN items i ON od.item_id = i.id " +
                "LEFT JOIN users u ON od.user_id = u.id " +
                "LEFT JOIN users partner ON i.user_id = partner.id " +
                "WHERE od.order_id = ?1")
                .setParameter(1, id).getResultList();

        return orderRepository.findById(id).map(o -> {
            var m = new LinkedHashMap<String, Object>();
            m.put("order", o);
            m.put("items", details.stream().map(r -> {
                var d = new LinkedHashMap<String, Object>();
                d.put("id", r[0]); d.put("itemId", r[1]); d.put("title", r[2] != null ? r[2] : "");
                d.put("unitPrice", r[3]); d.put("paidPrice", r[4]); d.put("status", r[5] != null ? r[5] : "");
                d.put("studentName", r[6] != null ? r[6] : "");
                boolean isChild = r[7] != null && ((Number) r[7]).intValue() == 1;
                d.put("isChild", isChild);
                d.put("ownerName", r[8] != null ? r[8] : "");
                return d;
            }).toList());
            return ApiResponse.ok(m);
        }).orElse(ApiResponse.fail("Not found"));
    }

    @PostMapping("/confirm")
    public ApiResponse<?> confirm(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        @SuppressWarnings("unchecked")
        var ids = (List<Number>) body.get("ids");
        if (ids == null || ids.isEmpty()) return ApiResponse.fail("ids required");

        ids.forEach(idNum -> {
            long orderId = idNum.longValue();
            orderRepository.findById(orderId).ifPresent(o -> {
                if (!"delivered".equals(o.getStatus())) {
                    // Delegate to PaymentApprovalService: updates order + order_details,
                    // approves all pending anyPoint transactions, credits wallet_c, sends notifications
                    paymentApprovalService.adminApproveOrder(orderId,
                            o.getPayment() != null ? o.getPayment() : "bank_transfer");
                }
            });
        });
        return ApiResponse.ok("Confirmed");
    }

    @PostMapping("/cancel")
    public ApiResponse<?> cancel(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        @SuppressWarnings("unchecked")
        var ids = (List<Number>) body.get("ids");
        if (ids == null || ids.isEmpty()) return ApiResponse.fail("ids required");

        ids.forEach(idNum ->
            paymentApprovalService.cancelOrder(idNum.longValue(), "admin"));
        return ApiResponse.ok("Cancelled");
    }
}
