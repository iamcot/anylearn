package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.TransactionRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/transactions")
@RequiredArgsConstructor
public class AdminTransactionController {

    private final TransactionRepository transactionRepository;
    private final EntityManager em;

    private boolean isAdmin(User user) {
        return user != null && "admin".equals(user.getRole());
    }

    @GetMapping
    public ApiResponse<?> list(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String payMethod) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");

        var sql = "SELECT t.id, t.type, t.amount, t.status, t.pay_method, t.created_at, " +
                  "u.name, u.phone " +
                  "FROM transactions t LEFT JOIN users u ON t.user_id = u.id WHERE 1=1" +
                  (status != null ? " AND t.status=" + status : "") +
                  (type != null && !type.isBlank() ? " AND t.type='" + type.replace("'","''") + "'" : "") +
                  (payMethod != null && !payMethod.isBlank() ? " AND t.pay_method='" + payMethod.replace("'","''") + "'" : "") +
                  " ORDER BY t.id DESC LIMIT " + size + " OFFSET " + (long) page * size;

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();

        var content = rows.stream().map(r -> {
            var m = new LinkedHashMap<String, Object>();
            m.put("id", r[0]); m.put("type", r[1] != null ? r[1] : "");
            m.put("amount", r[2]); m.put("status", r[3]);
            m.put("payMethod", r[4] != null ? r[4] : "");
            m.put("createdAt", r[5] != null ? r[5].toString() : "");
            m.put("userName", r[6] != null ? r[6] : ""); m.put("userPhone", r[7] != null ? r[7] : "");
            return m;
        }).toList();

        return ApiResponse.ok(Map.of("content", content, "page", page, "size", size));
    }

    @GetMapping("/{id}")
    public ApiResponse<?> detail(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return transactionRepository.findById(id)
                .map(ApiResponse::ok)
                .orElse(ApiResponse.fail("Not found"));
    }

    @PostMapping("/approve")
    public ApiResponse<?> approve(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        @SuppressWarnings("unchecked")
        var ids = (List<Number>) body.get("ids");
        if (ids == null || ids.isEmpty()) return ApiResponse.fail("ids required");

        ids.forEach(idNum -> transactionRepository.findById(idNum.longValue()).ifPresent(t -> {
            if (t.getStatus() == 0) { t.setStatus(1); transactionRepository.save(t); }
        }));
        return ApiResponse.ok("Approved");
    }

    @PostMapping("/reject")
    public ApiResponse<?> reject(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        @SuppressWarnings("unchecked")
        var ids = (List<Number>) body.get("ids");
        if (ids == null || ids.isEmpty()) return ApiResponse.fail("ids required");

        ids.forEach(idNum -> transactionRepository.findById(idNum.longValue()).ifPresent(t -> {
            if (t.getStatus() == 0) { t.setStatus(-1); transactionRepository.save(t); }
        }));
        return ApiResponse.ok("Rejected");
    }
}
