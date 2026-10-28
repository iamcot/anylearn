package com.anylearn.backend.service.achievement;

import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.fun.CoinService;
import com.anylearn.backend.service.fun.GameEventService;
import com.anylearn.backend.service.quiz.QuizBoardRules;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Shareable achievement banners of Vui học (plan 14, phase 6). A game calls {@link #grant} when something worth sharing
 * happens (a new rank, a check-in streak milestone, a top place of a week or month, a full sticker set); the row keeps a
 * public token, the player is notified and can open the share page. One banner per person and `dedupKey`, so nothing is
 * created twice. Creating a banner never breaks the game that asked for it.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AchievementService {

    private final JdbcTemplate jdbc;
    private final AchievementSettings settings;
    private final NotificationService notifications;
    private final CoinService coins;
    private final GameEventService events;

    /** Creates the banner and tells the player. Returns its token, or null when it is off, already made or failed. */
    public String grant(long userId, String type, String dedupKey, String title, String subtitle, String icon) {
        try {
            if (!settings.enabled() || !settings.typeEnabled(type) || !AchievementRules.TYPES.contains(type)) return null;
            String token = AchievementRules.newToken();
            int rows = jdbc.update("INSERT IGNORE INTO achievements (user_id, type, dedup_key, title, subtitle, icon, token) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    userId, type, dedupKey, title, subtitle, icon, token);
            if (rows != 1) return null;
            try {
                notifications.createNotification(userId, "achievement", title, "Bấm để tạo ảnh chia sẻ và mời bạn bè cùng chơi.", "/fun/share/" + token);
            } catch (Exception e) {
                log.warn("[achievement] notification for user {} failed: {}", userId, e.getMessage());
            }
            return token;
        } catch (Exception e) {
            log.warn("[achievement] could not create {} for user {}: {}", dedupKey, userId, e.getMessage());
            return null;
        }
    }

    public String displayName(long userId) {
        List<String> names = jdbc.query("SELECT name FROM users WHERE id = ?", (rs, i) -> rs.getString(1), userId);
        return QuizBoardRules.displayName(names.isEmpty() ? null : names.get(0));
    }

    private static Map<String, Object> view(Map<String, Object> row, String name, String refCode) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("token", row.get("token"));
        out.put("type", row.get("type"));
        out.put("title", row.get("title"));
        out.put("subtitle", row.get("subtitle"));
        out.put("icon", row.get("icon"));
        out.put("name", name);
        out.put("refCode", refCode);
        out.put("game", AchievementRules.gameOf(String.valueOf(row.get("type"))));
        out.put("createdAt", row.get("createdAt"));
        return out;
    }

    /** What the public share page shows: no phone except the referral code that the invitation link already carries. */
    public Optional<Map<String, Object>> publicView(String token) {
        if (!AchievementRules.validToken(token)) return Optional.empty();
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT a.id, a.user_id AS userId, a.token, a.type, a.title, a.subtitle, a.icon, a.created_at AS createdAt, u.name AS name, u.refcode AS refcode " +
                "FROM achievements a JOIN users u ON u.id = a.user_id WHERE a.token = ?", token);
        if (rows.isEmpty()) return Optional.empty();
        Map<String, Object> r = rows.get(0);
        return Optional.of(view(r, QuizBoardRules.displayName((String) r.get("name")), (String) r.get("refcode")));
    }

    /** The newest banners of a person, for the Vui học page. */
    public List<Map<String, Object>> mine(long userId, int limit) {
        return jdbc.queryForList("SELECT token, type, title, subtitle, icon, created_at AS createdAt, shares FROM achievements WHERE user_id = ? ORDER BY id DESC LIMIT " + Math.max(1, Math.min(limit, 50)), userId);
    }

    public void countOpen(String token) {
        if (AchievementRules.validToken(token)) jdbc.update("UPDATE achievements SET opens = opens + 1 WHERE token = ?", token);
    }

    /** Only the owner's share presses count. */
    public boolean countShare(long userId, String token) {
        return share(userId, token).get("counted") == Boolean.TRUE;
    }

    /**
     * Counts a share press of the owner and pays the Leo Xu reward when it is the banner's first one and the person is under the
     * daily limit (`achievement/share_coins`, `achievement/share_daily_max`). Writes the game event `banner/share`
     * that the weekly mission "share" counts. Returns {counted, coins}.
     */
    public Map<String, Object> share(long userId, String token) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("counted", false);
        out.put("coins", 0);
        if (!AchievementRules.validToken(token)) return out;
        boolean first = jdbc.update("UPDATE achievements SET shares = 1 WHERE token = ? AND user_id = ? AND shares = 0", token, userId) == 1;
        if (!first && jdbc.update("UPDATE achievements SET shares = shares + 1 WHERE token = ? AND user_id = ?", token, userId) != 1) return out;
        out.put("counted", true);
        events.record(userId, GameEventService.GAME_BANNER, "share", token, 0);
        try {
            Long paid = jdbc.queryForObject("SELECT COUNT(*) FROM fun_coin_ledger WHERE user_id = ? AND source = ? AND created_at >= CURDATE()", Long.class, userId, CoinService.SOURCE_SHARE);
            int reward = AchievementRules.shareReward(first, paid == null ? 0 : paid, settings.shareDailyMax(), settings.shareCoins());
            if (reward > 0) {
                coins.credit(userId, reward, CoinService.SOURCE_SHARE, "Chia sẻ thành tích");
                out.put("coins", reward);
            }
        } catch (Exception e) {
            log.warn("[achievement] share reward for user {} failed: {}", userId, e.getMessage());
        }
        return out;
    }

    /** Links the new account's referral row to the banner it came from; a token that does not exist is ignored. */
    public void attachSignup(String token, long newUserId) {
        try {
            Long id = idOf(token);
            if (id != null) jdbc.update("UPDATE referral_events SET achievement_id = ? WHERE new_user_id = ?", id, newUserId);
        } catch (Exception e) {
            log.warn("[achievement] could not attach sign-up {}: {}", newUserId, e.getMessage());
        }
    }

    public Long idOf(String token) {
        if (!AchievementRules.validToken(token)) return null;
        List<Long> ids = jdbc.query("SELECT id FROM achievements WHERE token = ?", (rs, i) -> rs.getLong(1), token);
        return ids.isEmpty() ? null : ids.get(0);
    }

    /** Per type: banners made, share presses, opens of the share page, sign-ups that came through one and those who then played. */
    public List<Map<String, Object>> stats() {
        List<Map<String, Object>> out = new java.util.ArrayList<>();
        for (String type : AchievementRules.TYPES) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("type", type);
            Map<String, Object> sums = jdbc.queryForMap("SELECT COUNT(*) AS made, COALESCE(SUM(shares), 0) AS shares, COALESCE(SUM(opens), 0) AS opens FROM achievements WHERE type = ?", type);
            row.putAll(sums);
            row.put("signups", jdbc.queryForObject("SELECT COUNT(*) FROM referral_events e JOIN achievements a ON a.id = e.achievement_id WHERE a.type = ?", Long.class, type));
            row.put("played", jdbc.queryForObject("SELECT COUNT(*) FROM referral_events e JOIN achievements a ON a.id = e.achievement_id " +
                    "WHERE a.type = ? AND (EXISTS (SELECT 1 FROM quiz_profiles p WHERE p.user_id = e.new_user_id AND p.games > 0) " +
                    "OR EXISTS (SELECT 1 FROM fun_checkins c WHERE c.user_id = e.new_user_id))", Long.class, type));
            out.add(row);
        }
        return out;
    }

    public List<Map<String, Object>> recent(int limit) {
        return jdbc.queryForList("SELECT a.id, a.type, a.title, a.shares, a.opens, a.created_at AS createdAt, u.name AS userName, " +
                "(SELECT COUNT(*) FROM referral_events e WHERE e.achievement_id = a.id) AS signups " +
                "FROM achievements a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT " + Math.max(1, Math.min(limit, 100)));
    }
}
