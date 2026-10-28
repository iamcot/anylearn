package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.fun.FunRules;
import com.anylearn.backend.service.fun.FunSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Back office of Vui học (plan 14): the log of everything that happens in the games and the check-in settings. */
@RestController
@RequestMapping("/admin/fun")
@RequiredArgsConstructor
public class AdminFunController {

    private final JdbcTemplate jdbc;
    private final FunSettings settings;

    private static boolean notAdmin(User user) {
        return user == null || !"admin".equals(user.getRole());
    }

    private long count(String sql, Object... args) {
        Long value = jdbc.queryForObject(sql, Long.class, args);
        return value == null ? 0 : value;
    }

    @GetMapping("/events")
    public ApiResponse<?> events(@AuthenticationPrincipal User user,
                                 @RequestParam(required = false) String game,
                                 @RequestParam(defaultValue = "1") int page,
                                 @RequestParam(defaultValue = "30") int size) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        int limit = Math.min(Math.max(size, 1), 100);
        int offset = (Math.max(page, 1) - 1) * limit;
        String where = game == null || game.isBlank() ? "" : " WHERE e.game = ?";
        Object[] filter = where.isEmpty() ? new Object[0] : new Object[]{game};
        List<Object> args = new ArrayList<>(List.of(filter));
        args.add(limit);
        args.add(offset);
        List<Map<String, Object>> rows = jdbc.query(
                "SELECT e.id, e.user_id, u.name, u.phone, e.game, e.type, e.detail, e.points, e.created_at " +
                        "FROM game_events e LEFT JOIN users u ON u.id = e.user_id" + where +
                        " ORDER BY e.id DESC LIMIT ? OFFSET ?",
                (rs, i) -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", rs.getLong("id"));
                    m.put("userId", rs.getObject("user_id"));
                    m.put("userName", rs.getString("name"));
                    m.put("userPhone", rs.getString("phone"));
                    m.put("game", rs.getString("game"));
                    m.put("type", rs.getString("type"));
                    m.put("detail", rs.getString("detail"));
                    m.put("points", rs.getInt("points"));
                    m.put("createdAt", rs.getTimestamp("created_at").toLocalDateTime().toString());
                    return m;
                }, args.toArray());
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", rows);
        out.put("total", count("SELECT COUNT(*) FROM game_events e" + where, filter));
        out.put("playersToday", count("SELECT COUNT(DISTINCT user_id) FROM game_events WHERE created_at >= CURDATE()"));
        out.put("eventsToday", count("SELECT COUNT(*) FROM game_events WHERE created_at >= CURDATE()"));
        out.put("pointsToday", count("SELECT COALESCE(SUM(points), 0) FROM game_events WHERE created_at >= CURDATE()"));
        out.put("referralsToday", count("SELECT COUNT(*) FROM referral_events WHERE created_at >= CURDATE()"));
        return ApiResponse.ok(out);
    }

    @GetMapping("/checkin-config")
    public ApiResponse<?> checkinConfig(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", settings.enabled());
        out.put("dayPoints", settings.checkinPoints());
        out.put("dailyCap", settings.checkinDailyCap());
        out.put("claimsToday", count("SELECT COUNT(*) FROM fun_checkins WHERE day = CURDATE()"));
        out.put("pointsToday", count("SELECT COALESCE(SUM(points), 0) FROM fun_checkins WHERE day = CURDATE()"));
        out.put("claimsPerDay7", count("SELECT COUNT(*) FROM fun_checkins WHERE day >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND day < CURDATE()") / 7.0);
        out.put("pointsPerDay7", count("SELECT COALESCE(SUM(points), 0) FROM fun_checkins WHERE day >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND day < CURDATE()") / 7.0);
        return ApiResponse.ok(out);
    }

    @PutMapping("/checkin-config")
    @SuppressWarnings("unchecked")
    public ApiResponse<?> saveCheckinConfig(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        List<Integer> points = new ArrayList<>();
        if (body.get("dayPoints") instanceof List<?> list) {
            for (Object value : list) points.add(value instanceof Number n ? n.intValue() : null);
        }
        String problem = FunRules.dayPointsProblem(points);
        if (problem != null) return ApiResponse.fail(problem);
        long cap = body.get("dailyCap") instanceof Number n ? n.longValue() : 0;
        if (cap < 0) return ApiResponse.fail("Trần anyPoint mỗi ngày không được âm");
        boolean enabled = !(body.get("enabled") instanceof Boolean b) || b;
        settings.save(enabled, points, cap);
        return checkinConfig(user);
    }
}
