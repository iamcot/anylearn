package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final EntityManager em;

    private boolean isAdmin(User user) {
        return user != null && "admin".equals(user.getRole());
    }

    @GetMapping("/stats")
    public ApiResponse<?> stats(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");

        LocalDateTime start = from != null ? LocalDate.parse(from).atStartOfDay() : LocalDateTime.now().minusMonths(1);
        LocalDateTime end   = to   != null ? LocalDate.parse(to).atTime(23, 59, 59) : LocalDateTime.now();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("totalUsers",    count("SELECT COUNT(*) FROM users"));
        data.put("newUsers",      count("SELECT COUNT(*) FROM users WHERE created_at BETWEEN ?1 AND ?2", start, end));
        data.put("totalPartners", count("SELECT COUNT(*) FROM users WHERE role IN ('teacher','school')"));
        data.put("newPartners",   count("SELECT COUNT(*) FROM users WHERE role IN ('teacher','school') AND created_at BETWEEN ?1 AND ?2", start, end));
        data.put("totalItems",    count("SELECT COUNT(*) FROM items"));
        data.put("newItems",      count("SELECT COUNT(*) FROM items WHERE created_at BETWEEN ?1 AND ?2", start, end));
        data.put("totalOrders",   count("SELECT COUNT(*) FROM orders"));
        data.put("newOrders",     count("SELECT COUNT(*) FROM orders WHERE created_at BETWEEN ?1 AND ?2", start, end));
        data.put("totalRevenue",  sum("SELECT COALESCE(SUM(amount),0) FROM orders WHERE status='delivered'"));
        data.put("periodRevenue", sum("SELECT COALESCE(SUM(amount),0) FROM orders WHERE status='delivered' AND created_at BETWEEN ?1 AND ?2", start, end));
        return ApiResponse.ok(data);
    }

    @GetMapping("/chart/users")
    public ApiResponse<?> chartUsers(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "day") String granularity) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        LocalDateTime start = from != null ? LocalDate.parse(from).atStartOfDay() : LocalDateTime.now().minusMonths(1);
        LocalDateTime end   = to   != null ? LocalDate.parse(to).atTime(23, 59, 59) : LocalDateTime.now();

        String[] exprs = groupExprs(granularity);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(
                "SELECT " + exprs[1] + " AS d, COUNT(*) AS c FROM users " +
                "WHERE created_at BETWEEN ?1 AND ?2 GROUP BY " + exprs[0] + " ORDER BY " + exprs[0])
                .setParameter(1, start).setParameter(2, end)
                .getResultList();
        return ApiResponse.ok(rows.stream().map(r -> Map.of("date", r[0].toString(), "count", r[1])).toList());
    }

    @GetMapping("/chart/gmv")
    public ApiResponse<?> chartGmv(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "day") String granularity) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        LocalDateTime start = from != null ? LocalDate.parse(from).atStartOfDay() : LocalDateTime.now().minusMonths(1);
        LocalDateTime end   = to   != null ? LocalDate.parse(to).atTime(23, 59, 59) : LocalDateTime.now();

        String[] exprs = groupExprs(granularity);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(
                "SELECT " + exprs[1] + " AS d, COALESCE(SUM(amount),0) AS amt FROM orders " +
                "WHERE status='delivered' AND created_at BETWEEN ?1 AND ?2 GROUP BY " + exprs[0] + " ORDER BY " + exprs[0])
                .setParameter(1, start).setParameter(2, end)
                .getResultList();
        return ApiResponse.ok(rows.stream().map(r -> Map.of("date", r[0].toString(), "amount", r[1])).toList());
    }

    @GetMapping("/top-partners")
    public ApiResponse<?> topPartners(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "10") int limit) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        LocalDateTime start = from != null ? LocalDate.parse(from).atStartOfDay() : LocalDateTime.now().minusMonths(1);
        LocalDateTime end   = to   != null ? LocalDate.parse(to).atTime(23, 59, 59) : LocalDateTime.now();

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(
                "SELECT u.id, u.name, u.phone, COUNT(od.id) AS orderCount, COALESCE(SUM(od.paid_price),0) AS revenue " +
                "FROM order_details od " +
                "JOIN items i ON od.item_id = i.id " +
                "JOIN users u ON i.user_id = u.id " +
                "WHERE od.created_at BETWEEN ?1 AND ?2 " +
                "GROUP BY u.id ORDER BY orderCount DESC LIMIT ?3")
                .setParameter(1, start).setParameter(2, end).setParameter(3, limit)
                .getResultList();
        return ApiResponse.ok(rows.stream().map(r -> Map.of(
                "userId", r[0], "name", r[1] != null ? r[1] : "", "phone", r[2] != null ? r[2] : "",
                "orderCount", r[3], "revenue", r[4])).toList());
    }

    @GetMapping("/top-items")
    public ApiResponse<?> topItems(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "10") int limit) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        LocalDateTime start = from != null ? LocalDate.parse(from).atStartOfDay() : LocalDateTime.now().minusMonths(1);
        LocalDateTime end   = to   != null ? LocalDate.parse(to).atTime(23, 59, 59) : LocalDateTime.now();

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(
                "SELECT i.id, i.title, COUNT(od.id) AS orderCount " +
                "FROM order_details od JOIN items i ON od.item_id = i.id " +
                "WHERE od.created_at BETWEEN ?1 AND ?2 " +
                "GROUP BY i.id ORDER BY orderCount DESC LIMIT ?3")
                .setParameter(1, start).setParameter(2, end).setParameter(3, limit)
                .getResultList();
        return ApiResponse.ok(rows.stream().map(r -> Map.of(
                "itemId", r[0], "title", r[1] != null ? r[1] : "", "orderCount", r[2])).toList());
    }

    /** Returns [groupByExpr, labelExpr] */
    private String[] groupExprs(String granularity) {
        return switch (granularity) {
            case "week"  -> new String[]{ "YEARWEEK(created_at, 3)", "DATE_FORMAT(MIN(created_at), '%Y-%m-%d')" };
            case "month" -> new String[]{ "DATE_FORMAT(created_at, '%Y-%m')", "DATE_FORMAT(created_at, '%Y-%m')" };
            default      -> new String[]{ "DATE(created_at)", "DATE(created_at)" };
        };
    }

    private long count(String sql, Object... params) {
        var q = em.createNativeQuery(sql);
        for (int i = 0; i < params.length; i++) q.setParameter(i + 1, params[i]);
        return ((Number) q.getSingleResult()).longValue();
    }

    private long sum(String sql, Object... params) {
        var q = em.createNativeQuery(sql);
        for (int i = 0; i < params.length; i++) q.setParameter(i + 1, params[i]);
        Object r = q.getSingleResult();
        return r == null ? 0L : ((Number) r).longValue();
    }
}
