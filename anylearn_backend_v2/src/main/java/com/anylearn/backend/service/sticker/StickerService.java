package com.anylearn.backend.service.sticker;

import com.anylearn.backend.service.fun.CoinService;
import com.anylearn.backend.service.fun.GameEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;

/** Stickers owned by people: grants, drops, the album and the full-set reward (plan 14, phase 3). */
@Service
@RequiredArgsConstructor
public class StickerService {

    private final JdbcTemplate jdbc;
    private final StickerSettings settings;
    private final com.anylearn.backend.service.fun.FunSettings funSettings;
    private final GameEventService gameEvents;
    private final CoinService coinService;
    private final Clock clock;

    private final Random random = new Random();

    public LocalDateTime now() {
        return LocalDateTime.now(clock);
    }

    /** One sticker as the API shows it. */
    public Map<String, Object> view(long id) {
        List<Map<String, Object>> rows = jdbc.query(
                "SELECT id, name, description, emoji, image_url, rarity FROM sticker_defs WHERE id = ?",
                (rs, i) -> viewRow(rs.getLong("id"), rs.getString("name"), rs.getString("description"), rs.getString("emoji"),
                        rs.getString("image_url"), rs.getString("rarity")), id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private static Map<String, Object> viewRow(long id, String name, String description, String emoji, String image, String rarity) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("name", name);
        m.put("description", description);
        m.put("emoji", emoji);
        m.put("image", image);
        m.put("rarity", rarity);
        m.put("rarityLabel", StickerRules.rarityLabel(rarity));
        return m;
    }

    public List<StickerRules.Weighted> pool() {
        return jdbc.query("SELECT id, rarity, drop_weight FROM sticker_defs WHERE active = 1",
                (rs, i) -> new StickerRules.Weighted(rs.getLong("id"), rs.getString("rarity"), rs.getInt("drop_weight")));
    }

    /** Gives one copy. {@code lockedUntil} keeps that copy out of trades (welcome pack). */
    @Transactional
    public void grant(long userId, long stickerId, String source, String ref, LocalDateTime lockedUntil) {
        jdbc.update("INSERT INTO user_stickers (user_id, sticker_id, qty) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE qty = qty + 1", userId, stickerId);
        jdbc.update("INSERT INTO sticker_grants (user_id, sticker_id, source, ref, locked_until) VALUES (?, ?, ?, ?, ?)",
                userId, stickerId, source, ref, lockedUntil == null ? null : Timestamp.valueOf(lockedUntil));
        Map<String, Object> def = view(stickerId);
        gameEvents.record(userId, GameEventService.GAME_STICKER, "grant:" + source,
                def == null ? "#" + stickerId : String.valueOf(def.get("name")), 0);
    }

    /** Takes one copy away (a trade, or the admin). False when the person does not hold enough. */
    @Transactional
    public boolean takeOne(long userId, long stickerId, int keepAtLeast) {
        int rows = jdbc.update("UPDATE user_stickers SET qty = qty - 1 WHERE user_id = ? AND sticker_id = ? AND qty > ?", userId, stickerId, Math.max(keepAtLeast, 0));
        if (rows != 1) return false;
        jdbc.update("UPDATE sticker_grants SET revoked = 1 WHERE id = (SELECT id FROM (SELECT id FROM sticker_grants WHERE user_id = ? AND sticker_id = ? AND revoked = 0 " +
                "ORDER BY (locked_until IS NULL) DESC, id DESC LIMIT 1) t)", userId, stickerId);
        jdbc.update("DELETE FROM user_stickers WHERE user_id = ? AND sticker_id = ? AND qty <= 0", userId, stickerId);
        return true;
    }

    /** A random sticker by drop weight from the whole active set; null when nothing can drop. */
    @Transactional
    public Map<String, Object> dropRandom(long userId, String source, String ref) {
        StickerRules.Weighted pick = StickerRules.pickWeighted(pool(), random.nextDouble());
        if (pick == null) return null;
        grant(userId, pick.id(), source, ref, null);
        return view(pick.id());
    }

    /** The sticker of a check-in: always on day 7 of the week (when switched on), else by chance. */
    public Map<String, Object> dropForCheckin(long userId, boolean day7) {
        if (!settings.enabled()) return null;
        boolean wanted = (day7 && settings.day7Sticker()) || random.nextInt(100) < settings.number("checkin_chance");
        return wanted ? dropRandom(userId, "checkin", null) : null;
    }

    public int ownedCount(long userId, long stickerId) {
        Integer qty = jdbc.queryForObject("SELECT COALESCE(SUM(qty), 0) FROM user_stickers WHERE user_id = ? AND sticker_id = ?", Integer.class, userId, stickerId);
        return qty == null ? 0 : qty;
    }

    public int lockedCopies(long userId, long stickerId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM sticker_grants WHERE user_id = ? AND sticker_id = ? AND revoked = 0 AND locked_until > ?",
                Integer.class, userId, stickerId, Timestamp.valueOf(now()));
        return n == null ? 0 : n;
    }

    public int tradable(long userId, long stickerId) {
        return StickerRules.tradableCopies(ownedCount(userId, stickerId), lockedCopies(userId, stickerId));
    }

    public int checkinDays(long userId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM fun_checkins WHERE user_id = ?", Integer.class, userId);
        return n == null ? 0 : n;
    }

    public boolean eligible(long userId) {
        List<Timestamp> created = jdbc.query("SELECT created_at FROM users WHERE id = ?", (rs, i) -> rs.getTimestamp("created_at"), userId);
        if (created.isEmpty() || created.get(0) == null) return false;
        long age = java.time.Duration.between(created.get(0).toLocalDateTime(), now()).toDays();
        return StickerRules.eligible(age, checkinDays(userId), settings.number("eligible_age_days"), settings.number("eligible_checkins"));
    }

    /** The album of one person: every active sticker (and any inactive one they hold) with the copies and what can be traded. */
    public Map<String, Object> album(long userId) {
        Map<Long, Integer> owned = new HashMap<>();
        jdbc.query("SELECT sticker_id, qty FROM user_stickers WHERE user_id = ?", rs -> { owned.put(rs.getLong("sticker_id"), rs.getInt("qty")); });
        Map<Long, Integer> locked = new HashMap<>();
        jdbc.query("SELECT sticker_id, COUNT(*) AS n FROM sticker_grants WHERE user_id = ? AND revoked = 0 AND locked_until > ? GROUP BY sticker_id",
                rs -> { locked.put(rs.getLong("sticker_id"), rs.getInt("n")); }, userId, Timestamp.valueOf(now()));
        List<Map<String, Object>> items = new ArrayList<>();
        int total = 0;
        int have = 0;
        List<Map<String, Object>> defs = jdbc.query(
                "SELECT id, name, description, emoji, image_url, rarity, active FROM sticker_defs ORDER BY sort_order, id",
                (rs, i) -> {
                    Map<String, Object> m = viewRow(rs.getLong("id"), rs.getString("name"), rs.getString("description"), rs.getString("emoji"),
                            rs.getString("image_url"), rs.getString("rarity"));
                    m.put("active", rs.getBoolean("active"));
                    return m;
                });
        for (Map<String, Object> def : defs) {
            long id = (Long) def.get("id");
            int qty = owned.getOrDefault(id, 0);
            boolean active = (Boolean) def.get("active");
            if (!active && qty == 0) continue;
            def.put("qty", qty);
            def.put("tradable", StickerRules.tradableCopies(qty, locked.getOrDefault(id, 0)));
            def.remove("active");
            items.add(def);
            if (active) {
                total++;
                if (qty > 0) have++;
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", settings.enabled());
        out.put("items", items);
        out.put("total", total);
        out.put("owned", have);
        out.put("eligible", eligible(userId));
        out.put("setReward", settings.number("set_reward_points"));
        out.put("coinName", funSettings.coinName());
        out.put("setRewardClaimed", count("SELECT COUNT(*) FROM sticker_set_rewards WHERE user_id = ?", userId) > 0);
        out.put("setComplete", total > 0 && have >= total);
        return out;
    }

    public long count(String sql, Object... args) {
        Long value = jdbc.queryForObject(sql, Long.class, args);
        return value == null ? 0 : value;
    }

    /**
     * Anyone who holds every active sticker gets the full-set reward (in game coins) once. Copies still locked from a welcome pack do not count,
     * and the account must be eligible, so a pile of fresh accounts cannot collect it.
     */
    @Transactional
    public Map<String, Object> claimSetReward(long userId) {
        if (!settings.enabled()) throw new IllegalStateException("Sticker đang tạm đóng");
        if (!eligible(userId)) throw new IllegalStateException("Tài khoản cần hoạt động thêm vài ngày mới nhận được thưởng đủ bộ");
        long active = count("SELECT COUNT(*) FROM sticker_defs WHERE active = 1");
        long counted = count("SELECT COUNT(DISTINCT d.id) FROM sticker_defs d JOIN sticker_grants g ON g.sticker_id = d.id AND g.user_id = ? AND g.revoked = 0 " +
                "AND (g.locked_until IS NULL OR g.locked_until <= ?) JOIN user_stickers us ON us.user_id = g.user_id AND us.sticker_id = d.id AND us.qty > 0 WHERE d.active = 1",
                userId, Timestamp.valueOf(now()));
        if (active == 0 || counted < active) throw new IllegalStateException("Chưa đủ bộ sticker");
        int points = settings.number("set_reward_points");
        int rows = jdbc.update("INSERT IGNORE INTO sticker_set_rewards (user_id, points) VALUES (?, ?)", userId, points);
        if (rows != 1) throw new IllegalStateException("Bạn đã nhận thưởng đủ bộ rồi");
        if (points > 0) coinService.credit(userId, points, CoinService.SOURCE_STICKER_SET, "Thưởng đủ bộ sticker");
        gameEvents.record(userId, GameEventService.GAME_STICKER, "set_reward", "Đủ bộ sticker", points);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("points", points);
        return out;
    }
}
