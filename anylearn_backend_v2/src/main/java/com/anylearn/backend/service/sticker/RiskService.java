package com.anylearn.backend.service.sticker;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

/**
 * A basic risk score per account (plan 14, phase 3): the app sends a random id of the browser, and we count how many other accounts
 * share it, the IP, or the person who invited them. The system never blocks by itself; a high score holds the welcome pack and the
 * invite reward in the review queue, and an admin decides ("blocked" also stops trading).
 */
@Service
@RequiredArgsConstructor
public class RiskService {

    private static final Pattern DEVICE = Pattern.compile("^[A-Za-z0-9_-]{8,64}$");

    private final JdbcTemplate jdbc;
    private final Clock clock;

    public void recordDevice(long userId, String deviceId, String ip) {
        if (deviceId == null || !DEVICE.matcher(deviceId).matches()) return;
        String cleanIp = ip == null ? null : (ip.length() > 64 ? ip.substring(0, 64) : ip);
        jdbc.update("INSERT IGNORE INTO device_ids (user_id, device_id, ip) VALUES (?, ?, ?)", userId, deviceId, cleanIp);
    }

    private int count(String sql, Object... args) {
        Integer n = jdbc.queryForObject(sql, Integer.class, args);
        return n == null ? 0 : n;
    }

    public StickerRules.Signals signals(long userId) {
        int sameDevice = count("SELECT COUNT(DISTINCT d2.user_id) FROM device_ids d1 JOIN device_ids d2 ON d2.device_id = d1.device_id AND d2.user_id <> d1.user_id WHERE d1.user_id = ?", userId);
        int sameIp = count("SELECT COUNT(DISTINCT d2.user_id) FROM device_ids d1 JOIN device_ids d2 ON d2.ip = d1.ip " +
                "AND d2.first_seen BETWEEN DATE_SUB(d1.first_seen, INTERVAL 1 DAY) AND DATE_ADD(d1.first_seen, INTERVAL 1 DAY) WHERE d1.user_id = ? AND d1.ip IS NOT NULL", userId);
        int siblings = count("SELECT COUNT(*) FROM users o JOIN users me ON me.id = ? AND me.user_id IS NOT NULL AND o.user_id = me.user_id " +
                "AND ABS(TIMESTAMPDIFF(HOUR, o.created_at, me.created_at)) < 24", userId);
        int trades = count("SELECT COUNT(*) FROM sticker_trades WHERE status = 'done' AND (a_user = ? OR b_user = ?)", userId, userId);
        int partners = count("SELECT COUNT(DISTINCT CASE WHEN a_user = ? THEN b_user ELSE a_user END) FROM sticker_trades WHERE status = 'done' AND (a_user = ? OR b_user = ?)", userId, userId, userId);
        int recentCheckins = count("SELECT COUNT(*) FROM fun_checkins WHERE user_id = ? AND day >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)", userId);
        return new StickerRules.Signals(sameDevice, sameIp, siblings, trades >= 1 && partners == 1 && recentCheckins == 0);
    }

    /** Computes the score, keeps it in `risk_flags` (a status the admin set stays) and returns it. */
    public int assess(long userId) {
        StickerRules.Signals signals = signals(userId);
        int score = StickerRules.riskScore(signals);
        if (score > 0 || existing(userId)) {
            String reasons = String.join("; ", StickerRules.riskReasons(signals));
            jdbc.update("INSERT INTO risk_flags (user_id, score, reasons, status) VALUES (?, ?, ?, 'open') " +
                    "ON DUPLICATE KEY UPDATE score = VALUES(score), reasons = VALUES(reasons), updated_at = NOW()", userId, score, reasons);
        }
        return score;
    }

    private boolean existing(long userId) {
        return count("SELECT COUNT(*) FROM risk_flags WHERE user_id = ?", userId) > 0;
    }

    /** True when the admin cleared this account, so a high score alone no longer holds its rewards. */
    public boolean cleared(long userId) {
        return count("SELECT COUNT(*) FROM risk_flags WHERE user_id = ? AND status = 'cleared'", userId) > 0;
    }

    public boolean blocked(long userId) {
        return count("SELECT COUNT(*) FROM risk_flags WHERE user_id = ? AND status = 'blocked'", userId) > 0;
    }

    /** Whether rewards for this account should wait for an admin. */
    public boolean shouldHold(long userId, int holdScore) {
        if (blocked(userId)) return true;
        if (cleared(userId)) return false;
        return assess(userId) >= holdScore;
    }

    public void setStatus(long userId, String status) {
        jdbc.update("INSERT INTO risk_flags (user_id, score, status) VALUES (?, 0, ?) ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()", userId, status);
    }

    public List<java.util.Map<String, Object>> flagged(int limit) {
        return jdbc.queryForList("SELECT f.user_id AS userId, u.name AS userName, u.phone AS userPhone, f.score, f.reasons, f.status, f.updated_at AS updatedAt " +
                "FROM risk_flags f LEFT JOIN users u ON u.id = f.user_id WHERE f.score > 0 OR f.status = 'blocked' ORDER BY (f.status = 'open') DESC, f.score DESC LIMIT ?", limit);
    }

    public LocalDateTime now() {
        return LocalDateTime.now(clock);
    }
}
