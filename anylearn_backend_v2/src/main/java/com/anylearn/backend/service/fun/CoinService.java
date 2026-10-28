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

    private final JdbcTemplate jdbc;

    public long balance(long userId) {
        List<Long> rows = jdbc.query("SELECT balance FROM fun_wallets WHERE user_id = ?", (rs, i) -> rs.getLong("balance"), userId);
        return rows.isEmpty() ? 0 : rows.get(0);
    }

    /** Adds coins (amount above 0) and writes the ledger line. Returns the new balance. */
    @Transactional
    public long credit(long userId, long amount, String source, String detail) {
        if (amount <= 0) return balance(userId);
        jdbc.update("INSERT INTO fun_wallets (user_id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance), updated_at = NOW()", userId, amount);
        long after = balance(userId);
        ledger(userId, amount, after, source, detail);
        return after;
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
}
