package com.anylearn.backend.service.sticker;

import com.anylearn.backend.service.achievement.AchievementRules;
import com.anylearn.backend.service.achievement.AchievementService;
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
    private final AchievementService achievements;

    private final Random random = new Random();

    public LocalDateTime now() {
        return LocalDateTime.now(clock);
    }

    /** One sticker as the API shows it. */
    public Map<String, Object> view(long id) {
        List<Map<String, Object>> rows = jdbc.query(
                "SELECT id, name, description, emoji, image_url, rarity, collection_id FROM sticker_defs WHERE id = ?",
                (rs, i) -> {
                    Map<String, Object> m = viewRow(rs.getLong("id"), rs.getString("name"), rs.getString("description"), rs.getString("emoji"),
                            rs.getString("image_url"), rs.getString("rarity"));
                    m.put("collectionId", rs.getLong("collection_id"));
                    return m;
                }, id);
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
        return jdbc.query("SELECT d.id, d.rarity, d.drop_weight FROM sticker_defs d JOIN sticker_collections c ON c.id = d.collection_id AND c.active = 1 WHERE d.active = 1",
                (rs, i) -> new StickerRules.Weighted(rs.getLong("id"), rs.getString("rarity"), rs.getInt("drop_weight")));
    }

    /**
     * `user_stickers` is the count of the person's live rows in `sticker_grants`. Rows added or removed by hand in the grants table
     * (or by an old bug) leave the album out of step, so the album repairs the counts before it reads them.
     */
    @Transactional
    public void syncFromGrants(long userId) {
        jdbc.update("INSERT INTO user_stickers (user_id, sticker_id, qty) SELECT g.user_id, g.sticker_id, COUNT(*) FROM sticker_grants g " +
                "WHERE g.user_id = ? AND g.revoked = 0 GROUP BY g.user_id, g.sticker_id ON DUPLICATE KEY UPDATE qty = VALUES(qty)", userId);
        jdbc.update("DELETE FROM user_stickers WHERE user_id = ? AND sticker_id NOT IN (SELECT sticker_id FROM sticker_grants WHERE user_id = ? AND revoked = 0)", userId, userId);
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

    /**
     * A random sticker: first one of the active collections with the same chance each (so rewards spread over all sets),
     * then a sticker of it by drop weight. Null when nothing can drop.
     */
    @Transactional
    public Map<String, Object> dropRandom(long userId, String source, String ref) {
        Map<Long, List<StickerRules.Weighted>> byCollection = new LinkedHashMap<>();
        jdbc.query("SELECT d.id, d.rarity, d.drop_weight, d.collection_id FROM sticker_defs d JOIN sticker_collections c ON c.id = d.collection_id AND c.active = 1 WHERE d.active = 1",
                rs -> { byCollection.computeIfAbsent(rs.getLong("collection_id"), k -> new ArrayList<>())
                        .add(new StickerRules.Weighted(rs.getLong("id"), rs.getString("rarity"), rs.getInt("drop_weight"))); });
        if (byCollection.isEmpty()) return null;
        List<List<StickerRules.Weighted>> sets = new ArrayList<>(byCollection.values());
        StickerRules.Weighted pick = StickerRules.pickWeighted(sets.get(random.nextInt(sets.size())), random.nextDouble());
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

    /**
     * The album of one person: every sticker of every collection that is on (and any inactive one they hold) with the copies and what can
     * be traded, plus one summary per collection (progress and the state of its full-set reward).
     */
    public Map<String, Object> album(long userId) {
        syncFromGrants(userId);
        Map<Long, Integer> owned = new HashMap<>();
        jdbc.query("SELECT sticker_id, qty FROM user_stickers WHERE user_id = ?", rs -> { owned.put(rs.getLong("sticker_id"), rs.getInt("qty")); }, userId);
        Map<Long, Integer> locked = new HashMap<>();
        jdbc.query("SELECT sticker_id, COUNT(*) AS n FROM sticker_grants WHERE user_id = ? AND revoked = 0 AND locked_until > ? GROUP BY sticker_id",
                rs -> { locked.put(rs.getLong("sticker_id"), rs.getInt("n")); }, userId, Timestamp.valueOf(now()));
        Set<Long> claimed = new HashSet<>(jdbc.queryForList("SELECT collection_id FROM sticker_set_rewards WHERE user_id = ?", Long.class, userId));

        List<Map<String, Object>> collections = jdbc.query(
                "SELECT id, name, description, emoji, image_url, reward_coins, active FROM sticker_collections ORDER BY sort_order, id",
                (rs, i) -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", rs.getLong("id"));
                    m.put("name", rs.getString("name"));
                    m.put("description", rs.getString("description"));
                    m.put("emoji", rs.getString("emoji"));
                    m.put("image", rs.getString("image_url"));
                    Object coins = rs.getObject("reward_coins");
                    m.put("rewardPoints", coins == null ? settings.number("set_reward_points") : ((Number) coins).intValue());
                    m.put("active", rs.getBoolean("active"));
                    return m;
                });
        Map<Long, Map<String, Object>> byId = new LinkedHashMap<>();
        for (Map<String, Object> c : collections) {
            c.put("total", 0);
            c.put("owned", 0);
            c.put("held", 0);
            byId.put((Long) c.get("id"), c);
        }

        List<Map<String, Object>> items = new ArrayList<>();
        List<Map<String, Object>> defs = jdbc.query(
                "SELECT id, name, description, emoji, image_url, rarity, active, collection_id FROM sticker_defs ORDER BY sort_order, id",
                (rs, i) -> {
                    Map<String, Object> m = viewRow(rs.getLong("id"), rs.getString("name"), rs.getString("description"), rs.getString("emoji"),
                            rs.getString("image_url"), rs.getString("rarity"));
                    m.put("collectionId", rs.getLong("collection_id"));
                    m.put("active", rs.getBoolean("active"));
                    return m;
                });
        for (Map<String, Object> def : defs) {
            long id = (Long) def.get("id");
            Map<String, Object> collection = byId.get((Long) def.get("collectionId"));
            if (collection == null) continue;
            int qty = owned.getOrDefault(id, 0);
            boolean live = (Boolean) def.get("active") && (Boolean) collection.get("active");
            if (!live && qty == 0) continue;
            def.put("qty", qty);
            def.put("tradable", StickerRules.tradableCopies(qty, locked.getOrDefault(id, 0)));
            def.remove("active");
            items.add(def);
            if (qty > 0) collection.merge("held", 1, (x, y) -> (Integer) x + 1);
            if (live) {
                collection.merge("total", 1, (x, y) -> (Integer) x + 1);
                if (qty > 0) collection.merge("owned", 1, (x, y) -> (Integer) x + 1);
            }
        }

        int total = 0;
        int have = 0;
        List<Map<String, Object>> shown = new ArrayList<>();
        for (Map<String, Object> c : collections) {
            boolean on = (Boolean) c.get("active");
            if (!on && (Integer) c.get("held") == 0) continue;
            int t = (Integer) c.get("total");
            int o = (Integer) c.get("owned");
            c.remove("held");
            c.put("rewardClaimed", claimed.contains((Long) c.get("id")));
            c.put("complete", on && t > 0 && o >= t);
            shown.add(c);
            if (on) {
                total += t;
                have += o;
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", settings.enabled());
        out.put("collections", shown);
        out.put("items", items);
        out.put("total", total);
        out.put("owned", have);
        out.put("eligible", eligible(userId));
        out.put("coinName", funSettings.coinName());
        return out;
    }

    public long count(String sql, Object... args) {
        Long value = jdbc.queryForObject(sql, Long.class, args);
        return value == null ? 0 : value;
    }

    /**
     * Anyone who holds every active sticker of a collection gets that collection's full-set reward (in game coins) once. Copies still locked
     * from a welcome pack do not count, and the account must be eligible, so a pile of fresh accounts cannot collect it.
     */
    @Transactional
    public Map<String, Object> claimSetReward(long userId, long collectionId) {
        if (!settings.enabled()) throw new IllegalStateException("Sticker đang tạm đóng");
        if (!eligible(userId)) throw new IllegalStateException("Tài khoản cần hoạt động thêm vài ngày mới nhận được thưởng đủ bộ");
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT name, reward_coins FROM sticker_collections WHERE id = ? AND active = 1", collectionId);
        if (rows.isEmpty()) throw new IllegalStateException("Không tìm thấy bộ sưu tập này");
        String name = String.valueOf(rows.get(0).get("name"));
        long active = count("SELECT COUNT(*) FROM sticker_defs WHERE active = 1 AND collection_id = ?", collectionId);
        long counted = count("SELECT COUNT(DISTINCT d.id) FROM sticker_defs d JOIN sticker_grants g ON g.sticker_id = d.id AND g.user_id = ? AND g.revoked = 0 " +
                "AND (g.locked_until IS NULL OR g.locked_until <= ?) JOIN user_stickers us ON us.user_id = g.user_id AND us.sticker_id = d.id AND us.qty > 0 " +
                "WHERE d.active = 1 AND d.collection_id = ?", userId, Timestamp.valueOf(now()), collectionId);
        if (active == 0 || counted < active) throw new IllegalStateException("Chưa đủ bộ sticker");
        Object custom = rows.get(0).get("reward_coins");
        int points = custom == null ? settings.number("set_reward_points") : ((Number) custom).intValue();
        int inserted = jdbc.update("INSERT IGNORE INTO sticker_set_rewards (user_id, collection_id, points) VALUES (?, ?, ?)", userId, collectionId, points);
        if (inserted != 1) throw new IllegalStateException("Bạn đã nhận thưởng đủ bộ này rồi");
        if (points > 0) coinService.credit(userId, points, CoinService.SOURCE_STICKER_SET, "Thưởng đủ bộ " + name);
        gameEvents.record(userId, GameEventService.GAME_STICKER, "set_reward", "Đủ bộ " + name, points);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("points", points);
        out.put("collection", name);
        out.put("achievement", achievements.grant(userId, AchievementRules.STICKER_SET, "set:" + collectionId, "Đủ bộ sticker " + name,
                "Đã sưu tầm đủ bộ cùng Leo", "sticker"));
        return out;
    }
}
