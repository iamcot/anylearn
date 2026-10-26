package com.anylearn.backend.service.me;

import com.anylearn.backend.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Numbers behind the /account menu (06.1) and the page of one child (06.2). Everything is scoped to the signed in parent. */
@Service
@RequiredArgsConstructor
public class MeSummaryService {

    private final JdbcTemplate jdbc;

    private int count(String sql, Object... args) {
        Integer n = jdbc.queryForObject(sql, Integer.class, args);
        return n == null ? 0 : n;
    }

    public Map<String, Object> summary(User user) {
        Long id = user.getId();
        int pendingOrders = count("SELECT COUNT(*) FROM orders WHERE user_id = ? AND status IN ('new','pay_pending')", id);
        int unread = count("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND `read` IS NULL AND type NOT IN ('sms','zalo')", id);
        int noDob = count("SELECT COUNT(*) FROM users c WHERE c.user_id = ? AND c.is_child = 1 AND c.status = 1 "
                + "AND (c.dob IS NULL OR c.dob_year_only = 1)", id);
        int toReview = count("SELECT COUNT(DISTINCT od.item_id) FROM order_details od JOIN orders o ON o.id = od.order_id "
                + "WHERE o.user_id = ? AND o.status = 'delivered' AND NOT EXISTS (SELECT 1 FROM item_user_actions a "
                + "WHERE a.user_id = ? AND a.item_id = od.item_id AND a.type = 'rating')", id, id);

        List<Map<String, Object>> children = new ArrayList<>();
        jdbc.query("SELECT c.id, c.name, c.dob, c.dob_year_only, "
                + "(SELECT COUNT(*) FROM user_course_enrollments e WHERE e.user_id = c.id AND e.status = 'active') AS active_courses "
                + "FROM users c WHERE c.user_id = ? AND c.is_child = 1 ORDER BY c.id", rs -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getLong("id"));
            row.put("name", rs.getString("name"));
            row.put("dobComplete", rs.getDate("dob") != null && !rs.getBoolean("dob_year_only"));
            row.put("activeCourses", rs.getInt("active_courses"));
            children.add(row);
        }, id);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("pendingOrders", pendingOrders);
        result.put("unreadNotifications", unread);
        result.put("children", children);
        result.put("todos", AccountTodos.build(pendingOrders, noDob, toReview, unread));
        result.put("walletC", user.getWalletC());
        return result;
    }

    /** One child of this parent: courses (running first), recent orders and counts. Null when the child is not theirs. */
    public Map<String, Object> child(User parent, Long childId) {
        List<Map<String, Object>> basic = jdbc.queryForList(
                "SELECT id, name, dob, dob_year_only, image FROM users WHERE id = ? AND user_id = ? AND is_child = 1", childId, parent.getId());
        if (basic.isEmpty()) return null;
        Map<String, Object> row = basic.get(0);

        List<Map<String, Object>> courses = new ArrayList<>();
        jdbc.query("SELECT e.id, e.item_id, i.title, e.status, e.start_date, e.end_date, e.order_id "
                + "FROM user_course_enrollments e JOIN items i ON i.id = e.item_id WHERE e.user_id = ? "
                + "ORDER BY (e.status = 'active') DESC, e.id DESC LIMIT 50", rs -> {
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("itemId", rs.getLong("item_id"));
            c.put("title", rs.getString("title"));
            c.put("status", rs.getString("status"));
            c.put("startDate", rs.getString("start_date"));
            c.put("endDate", rs.getString("end_date"));
            c.put("orderId", rs.getObject("order_id"));
            courses.add(c);
        }, childId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", row.get("id"));
        result.put("name", row.get("name"));
        result.put("avatar", row.get("image"));
        result.put("dob", row.get("dob") == null ? null : row.get("dob").toString());
        result.put("dobYearOnly", Boolean.TRUE.equals(row.get("dob_year_only")) || Integer.valueOf(1).equals(row.get("dob_year_only")));
        result.put("courses", courses);
        result.put("orderCount", count("SELECT COUNT(DISTINCT order_id) FROM order_details WHERE user_id = ?", childId));
        return result;
    }
}
