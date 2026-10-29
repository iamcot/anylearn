package com.anylearn.backend.service.fun;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * The currency of Vui học (default name "Leo Xu", see {@link FunSettings#coinName()}). It is **not** anyPoint: nothing here touches
 * `wallet_c`, creates a `transactions` row or sends a notification. Every game pays and charges through this class so the ledger
 * (`fun_coin_ledger`) is complete. Turning coins into anyPoint or gifts will be designed later.
 */
@Service
@RequiredArgsConstructor
public class CoinService {

    public static final String SOURCE_CHECKIN = "checkin";
    public static final String SOURCE_STICKER_SET = "sticker_set";
    public static final String SOURCE_ADMIN = "admin";
    public static final String SOURCE_QUIZ_RANK = "quiz_rank";
    public static final String SOURCE_QUIZ_ITEM = "quiz_item";
    public static final String SOURCE_MISSION = "mission";
    public static final String SOURCE_SHARE = "share";
    public static final String SOURCE_INVITE = "invite";
    public static final String SOURCE_ARENA = "arena";
    /** Leo Xu shop (plan 15): training packs, energy refills, sticker chests and the money Leo pays for what is sold back. */
    public static final String SOURCE_SHOP_PACK = "shop_pack";
    public static final String SOURCE_SHOP_ENERGY = "shop_energy";
    public static final String SOURCE_SHOP_CHEST = "shop_chest";
    public static final String SOURCE_SHOP_SELL = "shop_sell";

    private final JdbcTemplate jdbc;
    private final FunSettings funSettings;

    public long balance(long userId) {
        List<Long> rows = jdbc.query("SELECT balance FROM fun_wallets WHERE user_id = ?", (rs, i) -> rs.getLong("balance"), userId);
        return rows.isEmpty() ? 0 : rows.get(0);
    }

    /** Adds coins (amount above 0) and writes the ledger line. Returns the new balance. */
    @Transactional
    public long credit(long userId, long amount, String source, String detail) {
        if (amount <= 0) return balance(userId);
        amount = withinDailyCap(userId, amount, source);
        if (amount <= 0) return balance(userId);
        jdbc.update("INSERT INTO fun_wallets (user_id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance), updated_at = NOW()", userId, amount);
        long after = balance(userId);
        ledger(userId, amount, after, source, detail);
        return after;
    }

    /** The part of {@code amount} that fits under the daily earning cap (setting `fun/daily_earn_cap`); admin adjustments are never cut. */
    private long withinDailyCap(long userId, long amount, String source) {
        long cap = funSettings.dailyEarnCap();
        if (cap <= 0 || SOURCE_ADMIN.equals(source)) return amount;
        Long earned = jdbc.queryForObject("SELECT COALESCE(SUM(delta), 0) FROM fun_coin_ledger WHERE user_id = ? AND delta > 0 AND source <> ? AND created_at >= CURDATE()", Long.class, userId, SOURCE_ADMIN);
        return Math.min(amount, Math.max(cap - (earned == null ? 0 : earned), 0));
    }

    /** Takes coins; false (and nothing changes) when the balance is too low. */
    @Transactional
    public boolean debit(long userId, long amount, String source, String detail) {
        if (amount <= 0) return true;
        int rows = jdbc.update("UPDATE fun_wallets SET balance = balance - ?, updated_at = NOW() WHERE user_id = ? AND balance >= ?", amount, userId, amount);
        if (rows != 1) return false;
        ledger(userId, -amount, balance(userId), source, detail);
        return true;
    }

    private void ledger(long userId, long delta, long after, String source, String detail) {
        String text = detail == null ? null : (detail.length() > 255 ? detail.substring(0, 255) : detail);
        jdbc.update("INSERT INTO fun_coin_ledger (user_id, delta, balance_after, source, detail) VALUES (?, ?, ?, ?, ?)", userId, delta, after, source, text);
    }

    public List<Map<String, Object>> history(long userId, int limit) {
        return jdbc.queryForList("SELECT id, delta, balance_after AS balanceAfter, source, detail, created_at AS createdAt FROM fun_coin_ledger WHERE user_id = ? ORDER BY id DESC LIMIT ?", userId, limit);
    }

    /** One page of the ledger, newest first, with the total number of rows. */
    public Map<String, Object> historyPage(long userId, int page, int size) {
        int safeSize = Math.max(1, Math.min(size, 50));
        int safePage = Math.max(1, page);
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM fun_coin_ledger WHERE user_id = ?", Long.class, userId);
        Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("items", jdbc.queryForList("SELECT id, delta, balance_after AS balanceAfter, source, detail, created_at AS createdAt FROM fun_coin_ledger WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?",
                userId, safeSize, (safePage - 1) * safeSize));
        out.put("total", total == null ? 0 : total);
        out.put("page", safePage);
        out.put("size", safeSize);
        return out;
    }
}
