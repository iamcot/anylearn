package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.order.manual.ManualOrderRules;
import com.anylearn.backend.service.order.manual.ManualOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Back office "Đơn hàng" > "Nhập đơn tay": several orders in one press, each saved on its own (one failing never stops the others). */
@RestController
@RequestMapping("/admin/orders/manual")
@RequiredArgsConstructor
@Slf4j
public class AdminManualOrderController {

    private final ManualOrderService service;

    @GetMapping("/lookup")
    public ApiResponse<?> lookup(@AuthenticationPrincipal User user, @RequestParam String phone) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(service.lookup(phone));
    }

    @GetMapping("/payments")
    public ApiResponse<?> payments(@AuthenticationPrincipal User user) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(ManualOrderRules.PAYMENTS);
    }

    /** Body `{orders: [...]}`; answer `{created, failed, results: [{index, ok, error?, orderId?, ...}]}` in the same order. */
    @PostMapping
    public ApiResponse<?> create(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        if (!(body.get("orders") instanceof List<?> rows) || rows.isEmpty()) return ApiResponse.fail("Chưa có đơn nào");
        if (rows.size() > ManualOrderRules.MAX_ORDERS_PER_CALL)
            return ApiResponse.fail("Tối đa " + ManualOrderRules.MAX_ORDERS_PER_CALL + " đơn mỗi lần");
        List<Map<String, Object>> results = new ArrayList<>();
        int created = 0;
        for (int i = 0; i < rows.size(); i++) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("index", i);
            try {
                if (!(rows.get(i) instanceof Map<?, ?> row)) throw new IllegalArgumentException("Thiếu thông tin đơn hàng.");
                result.putAll(service.create(input(row), user));
                result.put("ok", true);
                created++;
            } catch (IllegalArgumentException | IllegalStateException e) {
                result.put("ok", false);
                result.put("error", e.getMessage());
            } catch (Exception e) {
                log.error("[manual-order] order {} of admin {} failed", i, user.getId(), e);
                result.put("ok", false);
                result.put("error", "Lỗi hệ thống: " + (e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage()));
            }
            results.add(result);
        }
        return ApiResponse.ok(Map.of("created", created, "failed", rows.size() - created, "results", results));
    }

    static ManualOrderRules.Input input(Map<?, ?> row) {
        List<ManualOrderRules.Line> lines = new ArrayList<>();
        if (row.get("items") instanceof List<?> items) {
            for (Object raw : items) {
                if (raw instanceof Map<?, ?> item)
                    lines.add(new ManualOrderRules.Line(toLong(item.get("itemId")), toLong(item.get("scheduleId")), text(item.get("startDate"))));
                else lines.add(new ManualOrderRules.Line(toLong(raw), null, null));
            }
        }
        return new ManualOrderRules.Input(text(row.get("phone")), text(row.get("name")), text(row.get("email")),
                Boolean.TRUE.equals(row.get("forChild")), toLong(row.get("childId")), text(row.get("childName")),
                text(row.get("childDob")), Boolean.TRUE.equals(row.get("childDobYearOnly")),
                lines, text(row.get("payment")), !Boolean.FALSE.equals(row.get("paid")), toLong(row.get("amount")), text(row.get("note")));
    }

    private static String text(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static Long toLong(Object value) {
        if (value instanceof Number number) return number.longValue();
        if (value instanceof String s && !s.isBlank()) {
            try { return Long.parseLong(s.trim()); } catch (NumberFormatException e) { return null; }
        }
        return null;
    }

    private static boolean isAdmin(User user) {
        return user != null && "admin".equals(user.getRole());
    }
}
