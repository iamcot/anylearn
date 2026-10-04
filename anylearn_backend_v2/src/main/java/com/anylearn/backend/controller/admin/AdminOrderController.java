package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.OrderRepository;
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
            @RequestParam(required = false) String q) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");

        var sql = "SELECT o.id, o.amount, o.status, o.payment, o.created_at, " +
                  "u.name, u.phone " +
                  "FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE 1=1" +
                  (status != null && !status.isBlank() ? " AND o.status='" + status.replace("'","''") + "'" : "") +
                  (payment != null && !payment.isBlank() ? " AND o.payment='" + payment.replace("'","''") + "'" : "") +
                  (q != null && !q.isBlank() ? " AND (u.name LIKE '%" + q.replace("'","''") + "%' OR u.phone LIKE '%" + q.replace("'","''") + "%')" : "") +
                  " ORDER BY o.id DESC LIMIT " + size + " OFFSET " + (long) page * size;

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();

        var content = rows.stream().map(r -> {
            var m = new LinkedHashMap<String, Object>();
            m.put("id", r[0]); m.put("amount", r[1]); m.put("status", r[2] != null ? r[2] : "");
            m.put("payment", r[3] != null ? r[3] : ""); m.put("createdAt", r[4] != null ? r[4].toString() : "");
            m.put("buyerName", r[5] != null ? r[5] : ""); m.put("buyerPhone", r[6] != null ? r[6] : "");
            return m;
        }).toList();

        return ApiResponse.ok(Map.of("content", content, "page", page, "size", size));
    }

    @GetMapping("/{id}")
    public ApiResponse<?> detail(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");

        @SuppressWarnings("unchecked")
        List<Object[]> details = em.createNativeQuery(
                "SELECT od.id, od.item_id, i.title, od.unit_price, od.paid_price, od.status " +
                "FROM order_details od JOIN items i ON od.item_id = i.id WHERE od.order_id = ?1")
                .setParameter(1, id).getResultList();

        return orderRepository.findById(id).map(o -> {
            var m = new LinkedHashMap<String, Object>();
            m.put("order", o);
            m.put("items", details.stream().map(r -> {
                var d = new LinkedHashMap<String, Object>();
                d.put("id", r[0]); d.put("itemId", r[1]); d.put("title", r[2] != null ? r[2] : "");
                d.put("unitPrice", r[3]); d.put("paidPrice", r[4]); d.put("status", r[5] != null ? r[5] : "");
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

        ids.forEach(idNum -> orderRepository.findById(idNum.longValue()).ifPresent(o -> {
            if ("bank_transfer".equals(o.getPayment()) && !"delivered".equals(o.getStatus())) {
                o.setStatus("delivered");
                orderRepository.save(o);
            }
        }));
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

        ids.forEach(idNum -> orderRepository.findById(idNum.longValue()).ifPresent(o -> {
            if (!"delivered".equals(o.getStatus()) && !"cancelled".equals(o.getStatus())) {
                o.setStatus("cancelled");
                orderRepository.save(o);
            }
        }));
        return ApiResponse.ok("Cancelled");
    }
}
