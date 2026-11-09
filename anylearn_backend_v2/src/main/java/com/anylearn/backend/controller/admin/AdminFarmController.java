package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.farm.FarmSettings;
import com.anylearn.backend.service.fun.FunSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/** Back office of Nông trại anyLEARN (plan 22): the numbers, the crop catalog and a few totals. */
@RestController
@RequestMapping("/admin/farm")
@RequiredArgsConstructor
public class AdminFarmController {

    private final JdbcTemplate jdbc;
    private final FarmSettings settings;
    private final FunSettings funSettings;

    private static boolean notAdmin(User user) {
        return user == null || !"admin".equals(user.getRole());
    }

    private long count(String sql) {
        Long v = jdbc.queryForObject(sql, Long.class);
        return v == null ? 0 : v;
    }

    @GetMapping("/settings")
    public ApiResponse<?> getSettings(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        Map<String, Object> out = new LinkedHashMap<>(settings.asMap());
        out.put("coinName", funSettings.coinName());
        out.put("players", count("SELECT COUNT(*) FROM farm_profiles"));
        out.put("playersToday", count("SELECT COUNT(*) FROM farm_profiles WHERE last_visit_at >= CURDATE()"));
        out.put("coinsInToday", count("SELECT COALESCE(SUM(coins_in), 0) FROM farm_day_stats WHERE day = CURDATE()"));
        out.put("coinsSpentToday", count("SELECT COALESCE(SUM(coins_spent), 0) FROM farm_day_stats WHERE day = CURDATE()"));
        out.put("coinsIn7d", count("SELECT COALESCE(SUM(coins_in), 0) FROM farm_day_stats WHERE day >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)"));
        out.put("coinsSpent7d", count("SELECT COALESCE(SUM(coins_spent), 0) FROM farm_day_stats WHERE day >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)"));
        return ApiResponse.ok(out);
    }

    @PutMapping("/settings")
    public ApiResponse<?> saveSettings(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        String problem = settings.save(body);
        return problem == null ? getSettings(user) : ApiResponse.fail(problem);
    }

    @GetMapping("/crops")
    public ApiResponse<?> crops(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(jdbc.queryForList("SELECT * FROM farm_crops ORDER BY sort_order, crop_key"));
    }

    /** Edits one crop; only the listed fields can change, each inside a sane range. */
    @PutMapping("/crops/{key}")
    public ApiResponse<?> saveCrop(@AuthenticationPrincipal User user, @PathVariable String key, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        Map<String, int[]> numeric = Map.of("grow_minutes", new int[]{1, 100000}, "water_needs", new int[]{0, 10}, "seed_price", new int[]{0, 100000},
                "unit_price", new int[]{0, 100000}, "base_yield", new int[]{1, 50}, "xp", new int[]{0, 100000}, "unlock_level", new int[]{1, 30},
                "stealable", new int[]{0, 1}, "sort_order", new int[]{0, 10000}, "active", new int[]{0, 1});
        for (Map.Entry<String, int[]> e : numeric.entrySet()) {
            Object v = body.get(e.getKey());
            if (v == null) continue;
            if (!(v instanceof Number n) || n.intValue() < e.getValue()[0] || n.intValue() > e.getValue()[1]) {
                return ApiResponse.fail("Giá trị " + e.getKey() + " phải từ " + e.getValue()[0] + " đến " + e.getValue()[1]);
            }
        }
        if (jdbc.queryForObject("SELECT COUNT(*) FROM farm_crops WHERE crop_key = ?", Integer.class, key) == 0) return ApiResponse.fail("Không có cây này");
        for (Map.Entry<String, int[]> e : numeric.entrySet()) {
            if (body.get(e.getKey()) instanceof Number n) jdbc.update("UPDATE farm_crops SET " + e.getKey() + " = ? WHERE crop_key = ?", n.intValue(), key);
        }
        for (String text : new String[]{"name", "description", "emoji"}) {
            if (body.get(text) instanceof String s && !s.isBlank()) jdbc.update("UPDATE farm_crops SET " + text + " = ? WHERE crop_key = ?", s.trim(), key);
        }
        return crops(user);
    }
}
