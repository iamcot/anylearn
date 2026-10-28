package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.fun.CoinService;
import com.anylearn.backend.service.fun.FunSettings;
import com.anylearn.backend.service.fun.GameEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Back office of the Vui học currency (default "Ali Xu"): its name, how much is in circulation, balances, and manual adjustments. */
@RestController
@RequestMapping("/admin/fun/coins")
@RequiredArgsConstructor
public class AdminFunCoinController {

    private final JdbcTemplate jdbc;
    private final FunSettings settings;
    private final CoinService coins;
    private final GameEventService gameEvents;

    private static boolean notAdmin(User user) {
        return user == null || !"admin".equals(user.getRole());
    }

    private long count(String sql, Object... args) {
        Long value = jdbc.queryForObject(sql, Long.class, args);
        return value == null ? 0 : value;
    }

    @GetMapping
    public ApiResponse<?> overview(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("name", settings.coinName());
        out.put("circulation", count("SELECT COALESCE(SUM(balance), 0) FROM fun_wallets"));
        out.put("holders", count("SELECT COUNT(*) FROM fun_wallets WHERE balance > 0"));
        out.put("issuedToday", count("SELECT COALESCE(SUM(delta), 0) FROM fun_coin_ledger WHERE delta > 0 AND created_at >= CURDATE()"));
        out.put("spentToday", count("SELECT COALESCE(-SUM(delta), 0) FROM fun_coin_ledger WHERE delta < 0 AND created_at >= CURDATE()"));
        out.put("issued7", count("SELECT COALESCE(SUM(delta), 0) FROM fun_coin_ledger WHERE delta > 0 AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"));
        out.put("bySource7", jdbc.queryForList("SELECT source, COALESCE(SUM(CASE WHEN delta > 0 THEN delta ELSE 0 END), 0) AS issued, " +
                "COALESCE(SUM(CASE WHEN delta < 0 THEN -delta ELSE 0 END), 0) AS spent FROM fun_coin_ledger " +
                "WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY source ORDER BY issued DESC"));
        out.put("top", jdbc.queryForList("SELECT w.user_id AS userId, u.name AS userName, u.phone AS userPhone, w.balance FROM fun_wallets w " +
                "LEFT JOIN users u ON u.id = w.user_id WHERE w.balance > 0 ORDER BY w.balance DESC LIMIT 10"));
        return ApiResponse.ok(out);
    }

    @PutMapping("/name")
    public ApiResponse<?> rename(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        String problem = settings.saveCoinName(body.get("name") instanceof String s ? s : null);
        return problem == null ? overview(user) : ApiResponse.fail(problem);
    }

    @GetMapping("/members")
    public ApiResponse<?> members(@AuthenticationPrincipal User user, @RequestParam(required = false) String q) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        String like = "%" + (q == null ? "" : q.trim()) + "%";
        return ApiResponse.ok(jdbc.queryForList("SELECT u.id, u.name, u.phone, COALESCE(w.balance, 0) AS balance FROM users u " +
                "LEFT JOIN fun_wallets w ON w.user_id = u.id WHERE (u.name LIKE ? OR u.phone LIKE ?) AND u.is_child = 0 " +
                "ORDER BY balance DESC, u.id DESC LIMIT 30", like, like));
    }

    @GetMapping("/ledger")
    public ApiResponse<?> ledger(@AuthenticationPrincipal User user, @RequestParam(required = false) Long userId, @RequestParam(defaultValue = "1") int page) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        int offset = (Math.max(page, 1) - 1) * 30;
        String where = userId == null ? "" : " WHERE l.user_id = ?";
        Object[] filter = userId == null ? new Object[0] : new Object[]{userId};
        Object[] args = java.util.Arrays.copyOf(filter, filter.length + 1);
        args[filter.length] = offset;
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT l.id, l.user_id AS userId, u.name AS userName, u.phone AS userPhone, l.delta, l.balance_after AS balanceAfter, " +
                "l.source, l.detail, l.created_at AS createdAt FROM fun_coin_ledger l LEFT JOIN users u ON u.id = l.user_id" + where + " ORDER BY l.id DESC LIMIT 30 OFFSET ?", args);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", rows);
        out.put("total", count("SELECT COUNT(*) FROM fun_coin_ledger l" + where, filter));
        return ApiResponse.ok(out);
    }

    /** Adds (positive) or takes away (negative) coins of one member; a reason is required and ends up in the ledger and the game events. */
    @PostMapping("/adjust")
    public ApiResponse<?> adjust(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        if (!(body.get("userId") instanceof Number userId) || !(body.get("amount") instanceof Number amount) || amount.longValue() == 0) return ApiResponse.fail("Cần chọn thành viên và nhập số khác 0");
        String reason = body.get("reason") instanceof String s ? s.trim() : "";
        if (reason.length() < 3) return ApiResponse.fail("Cần ghi lý do điều chỉnh");
        if (Math.abs(amount.longValue()) > 1_000_000) return ApiResponse.fail("Mỗi lần điều chỉnh tối đa 1.000.000");
        long value = amount.longValue();
        String detail = "Admin #" + user.getId() + ": " + reason;
        if (value > 0) coins.credit(userId.longValue(), value, CoinService.SOURCE_ADMIN, detail);
        else if (!coins.debit(userId.longValue(), -value, CoinService.SOURCE_ADMIN, detail)) return ApiResponse.fail("Số dư của thành viên không đủ để trừ");
        gameEvents.record(userId.longValue(), GameEventService.GAME_COIN, "admin_adjust", detail, (int) Math.max(Math.min(value, Integer.MAX_VALUE), Integer.MIN_VALUE));
        return ApiResponse.ok(Map.of("balance", coins.balance(userId.longValue())));
    }
}
