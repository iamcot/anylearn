package com.anylearn.backend.service.farm;

import com.anylearn.backend.service.quiz.QuizBoardRules;
import com.anylearn.backend.service.fun.GameEventService;
import com.anylearn.backend.service.sticker.StickerService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Neighbours of Nông trại anyLEARN (plan 22.5): visit a farm, water or fertilize for its owner, and pick a limited number of flowers.
 * Only people who passed {@link StickerService#eligible} (account age and check-in days) take part. A picked flower goes to
 * `qty_received` and can never be sold, only delivered to orders. Names are shown as two last words.
 */
@Service
@RequiredArgsConstructor
public class FarmSocialService {

    private final JdbcTemplate jdbc;
    private final FarmService farm;
    private final FarmSettings settings;
    private final StickerService stickers;
    private final GameEventService events;

    private FarmGameRules.SocialLimits limits() {
        return new FarmGameRules.SocialLimits(settings.n("help_daily"), settings.n("help_received_daily"), settings.n("steal_daily"), settings.n("stolen_daily"), settings.n("steal_min_left"));
    }

    private void requireEligible(long userId, String who) {
        if (!stickers.eligible(userId)) throw new IllegalStateException(who + " cần dùng app thêm vài ngày (có tài khoản từ 3 ngày và điểm danh 3 ngày) để chơi cùng hàng xóm.");
    }

    private int countToday(String column, long id, String kind) {
        Integer v = jdbc.queryForObject("SELECT COALESCE(SUM(GREATEST(qty, 1)), 0) FROM farm_social_log WHERE " + column + " = ? AND day = ? AND kind = ?", Integer.class, id, FarmService.Date(farm.today()), kind);
        return v == null ? 0 : v;
    }

    private String nameOf(long userId) {
        List<String> n = jdbc.query("SELECT name FROM users WHERE id = ?", (rs, i) -> rs.getString(1), userId);
        return QuizBoardRules.displayName(n.isEmpty() ? null : n.get(0));
    }

    private void log(long actor, long owner, String kind, Integer slot, String item, int qty) {
        jdbc.update("INSERT INTO farm_social_log (actor_id, owner_id, day, kind, slot, item_key, qty) VALUES (?, ?, ?, ?, ?, ?, ?)", actor, owner, FarmService.Date(farm.today()), kind, slot, item, qty);
    }

    // ---------------------------------------------------------------- neighbours

    public List<Map<String, Object>> list(long userId) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> r : jdbc.queryForList("SELECT n.neighbor_id AS id, u.name, p.level FROM farm_neighbors n JOIN users u ON u.id = n.neighbor_id LEFT JOIN farm_profiles p ON p.user_id = n.neighbor_id WHERE n.user_id = ? ORDER BY n.created_at DESC", userId)) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("userId", r.get("id"));
            m.put("name", QuizBoardRules.displayName((String) r.get("name")));
            m.put("level", r.get("level") == null ? 1 : r.get("level"));
            out.add(m);
        }
        return out;
    }

    /** Adds a neighbour by phone or referral code; both sides become neighbours at once. */
    @Transactional
    public Map<String, Object> add(long userId, String code) {
        String c = code == null ? "" : code.trim();
        if (c.isEmpty()) throw new IllegalStateException("Nhập số điện thoại hoặc mã giới thiệu của bạn bè.");
        List<Long> ids = jdbc.query("SELECT id FROM users WHERE (phone = ? OR refcode = ?) AND status = 1 LIMIT 1", (rs, i) -> rs.getLong(1), c, c);
        if (ids.isEmpty()) throw new IllegalStateException("Không tìm thấy người chơi này.");
        long other = ids.get(0);
        if (other == userId) throw new IllegalStateException("Đó là bạn mà!");
        Integer hasFarm = jdbc.queryForObject("SELECT COUNT(*) FROM farm_profiles WHERE user_id = ?", Integer.class, other);
        if (hasFarm == null || hasFarm == 0) throw new IllegalStateException("Người này chưa mở Nông trại.");
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM farm_neighbors WHERE user_id = ?", Integer.class, userId);
        if (count != null && count >= settings.n("max_neighbors")) throw new IllegalStateException("Bạn đã có đủ hàng xóm.");
        jdbc.update("INSERT IGNORE INTO farm_neighbors (user_id, neighbor_id) VALUES (?, ?)", userId, other);
        jdbc.update("INSERT IGNORE INTO farm_neighbors (user_id, neighbor_id) VALUES (?, ?)", other, userId);
        events.record(userId, GameEventService.GAME_FARM, "neighbor", String.valueOf(other), 0);
        return Map.of("added", nameOf(other));
    }

    @Transactional
    public Map<String, Object> remove(long userId, long other) {
        jdbc.update("DELETE FROM farm_neighbors WHERE (user_id = ? AND neighbor_id = ?) OR (user_id = ? AND neighbor_id = ?)", userId, other, other, userId);
        return Map.of("removed", true);
    }

    // ---------------------------------------------------------------- suggestions and visiting

    private List<Map<String, Object>> plotsOf(long ownerId, boolean forVisitor) {
        FarmRules.Params params = settings.params();
        LocalDateTime now = farm.now();
        Map<String, Map<String, Object>> crops = farm.cropMap();
        int count = jdbc.queryForObject("SELECT plots FROM farm_profiles WHERE user_id = ?", Integer.class, ownerId);
        Map<Integer, Map<String, Object>> rows = new LinkedHashMap<>();
        for (Map<String, Object> r : jdbc.queryForList("SELECT * FROM farm_plots WHERE user_id = ?", ownerId)) rows.put(((Number) r.get("slot")).intValue(), r);
        List<Map<String, Object>> out = new ArrayList<>();
        for (int slot = 0; slot < count; slot++) {
            Map<String, Object> row = rows.get(slot);
            FarmRules.Plot plot = farm.plotOf(row, crops);
            FarmRules.View v = FarmRules.view(plot, now, params);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("slot", slot);
            m.put("phase", v.phase().name().toLowerCase());
            if (plot != null) {
                Map<String, Object> crop = crops.get((String) row.get("crop_key"));
                m.put("cropKey", row.get("crop_key"));
                m.put("emoji", crop == null ? null : crop.get("emoji"));
                m.put("name", crop == null ? null : crop.get("name"));
                boolean stealable = crop != null && ((Number) crop.get("stealable")).intValue() == 1;
                m.put("stealable", stealable);
                long minutesAfterRipe = v.ripeAt() == null ? 0 : Duration.between(v.ripeAt(), now).toMinutes();
                boolean pickable = stealable && (v.phase() == FarmRules.Phase.RIPE || v.phase() == FarmRules.Phase.WILTING)
                        && minutesAfterRipe >= settings.n("steal_grace_minutes") && ((Number) row.get("stolen")).intValue() < 1;
                m.put("pickable", pickable);
                m.put("needsWater", v.needsWater());
                m.put("fertilized", plot.fertilized());
            }
            out.add(m);
        }
        return out;
    }

    /** Six farms of other players, those with thirsty plants or flowers that can be picked first. */
    public List<Map<String, Object>> suggestions(long userId) {
        List<Long> ids = jdbc.query("SELECT p.user_id FROM farm_profiles p WHERE p.user_id <> ? AND p.last_visit_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) "
                + "AND p.user_id NOT IN (SELECT neighbor_id FROM farm_neighbors WHERE user_id = ?) ORDER BY RAND() LIMIT 40", (rs, i) -> rs.getLong(1), userId, userId);
        List<Map<String, Object>> scored = new ArrayList<>();
        for (long id : ids) {
            List<Map<String, Object>> plots = plotsOf(id, true);
            long thirsty = plots.stream().filter(p -> Boolean.TRUE.equals(p.get("needsWater"))).count();
            long pickable = plots.stream().filter(p -> Boolean.TRUE.equals(p.get("pickable"))).count();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("userId", id);
            m.put("name", nameOf(id));
            m.put("thirsty", thirsty);
            m.put("pickable", pickable);
            m.put("score", thirsty * 2 + pickable);
            scored.add(m);
        }
        scored.sort(Comparator.comparingLong((Map<String, Object> m) -> -((Number) m.get("score")).longValue()));
        return scored.size() > 6 ? scored.subList(0, 6) : scored;
    }

    @Transactional
    public Map<String, Object> visit(long userId, long ownerId) {
        farm.checkOpen();
        farm.lockProfile(userId);
        if (userId == ownerId) throw new IllegalStateException("Đây là vườn của bạn.");
        List<Map<String, Object>> owner = jdbc.queryForList("SELECT level, allow_steal, has_dog FROM farm_profiles WHERE user_id = ?", ownerId);
        if (owner.isEmpty()) throw new IllegalStateException("Người này chưa mở Nông trại.");
        requireEligible(userId, "Bạn");
        farm.bump(userId, "visit", 1);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("userId", ownerId);
        out.put("name", nameOf(ownerId));
        out.put("level", owner.get(0).get("level"));
        out.put("allowSteal", ((Number) owner.get(0).get("allow_steal")).intValue() == 1);
        out.put("hasDog", ((Number) owner.get(0).get("has_dog")).intValue() == 1);
        out.put("plots", plotsOf(ownerId, true));
        out.put("helpLeft", Math.max(settings.n("help_daily") - countToday("actor_id", userId, "water") - countToday("actor_id", userId, "fertilize"), 0));
        out.put("stealLeft", Math.max(settings.n("steal_daily") - countToday("actor_id", userId, "steal"), 0));
        return out;
    }

    // ---------------------------------------------------------------- helping

    private void checkHelp(long userId, long ownerId) {
        requireEligible(userId, "Bạn");
        requireEligible(ownerId, "Chủ vườn");
        farm.lockProfile(userId);
        String problem = FarmGameRules.helpProblem(countToday("actor_id", userId, "water") + countToday("actor_id", userId, "fertilize"),
                countToday("owner_id", ownerId, "water") + countToday("owner_id", ownerId, "fertilize"), limits());
        if (problem != null) throw new IllegalStateException(problem);
    }

    @Transactional
    public Map<String, Object> water(long userId, long ownerId, List<Integer> slots) {
        farm.checkOpen();
        if (userId == ownerId) throw new IllegalStateException("Đây là vườn của bạn.");
        checkHelp(userId, ownerId);
        int watered = 0;
        for (int slot : slots) {
            if (FarmGameRules.helpProblem(countToday("actor_id", userId, "water") + countToday("actor_id", userId, "fertilize"),
                    countToday("owner_id", ownerId, "water") + countToday("owner_id", ownerId, "fertilize"), limits()) != null) break;
            if (farm.waterFor(ownerId, List.of(slot)) == 1) {
                log(userId, ownerId, "water", slot, null, 1);
                watered++;
            }
        }
        if (watered == 0) throw new IllegalStateException("Không có ô nào cần tưới.");
        farm.bump(userId, "help", watered);
        Map<String, Object> out = new LinkedHashMap<>(farm.gainXp(userId, 3L * watered));
        out.put("watered", watered);
        out.put("xp", 3 * watered);
        events.record(userId, GameEventService.GAME_FARM, "help", "water " + watered, 0);
        return out;
    }

    @Transactional
    public Map<String, Object> fertilize(long userId, long ownerId, int slot) {
        farm.checkOpen();
        if (userId == ownerId) throw new IllegalStateException("Đây là vườn của bạn.");
        checkHelp(userId, ownerId);
        FarmRules.Plot plot = farm.plotOf(farm.plotRow(ownerId, slot), farm.cropMap());
        if (plot == null) throw new IllegalStateException("Ô này đang trống.");
        FarmRules.View v = FarmRules.view(plot, farm.now(), settings.params());
        if (v.phase() == FarmRules.Phase.RIPE || v.phase() == FarmRules.Phase.WILTING) throw new IllegalStateException("Cây đã chín rồi.");
        if (plot.fertilized()) throw new IllegalStateException("Cây này đã được bón rồi.");
        if (!farm.takeOwn(userId, FarmService.FERTILIZER, 1)) throw new IllegalStateException("Bạn hết phân bón (phân của bạn sẽ được dùng để bón giúp).");
        jdbc.update("UPDATE farm_plots SET fertilized = 1 WHERE user_id = ? AND slot = ?", ownerId, slot);
        log(userId, ownerId, "fertilize", slot, null, 1);
        farm.bump(userId, "help", 1);
        Map<String, Object> out = new LinkedHashMap<>(farm.gainXp(userId, 3));
        out.put("xp", 3);
        events.record(userId, GameEventService.GAME_FARM, "help", "fertilize", 0);
        return out;
    }

    // ---------------------------------------------------------------- picking flowers

    @Transactional
    public Map<String, Object> steal(long userId, long ownerId, int slot) {
        farm.checkOpen();
        if (userId == ownerId) throw new IllegalStateException("Đây là vườn của bạn.");
        if (settings.n("steal_enabled") != 1) throw new IllegalStateException("Hái trộm đang tạm tắt.");
        Map<String, Object> me = farm.lockProfile(userId);
        requireEligible(userId, "Bạn");
        requireEligible(ownerId, "Chủ vườn");
        List<Map<String, Object>> owner = jdbc.queryForList("SELECT allow_steal, has_dog FROM farm_profiles WHERE user_id = ? FOR UPDATE", ownerId);
        if (owner.isEmpty()) throw new IllegalStateException("Người này chưa mở Nông trại.");
        Map<String, Object> row = farm.plotRow(ownerId, slot);
        FarmRules.Plot plot = farm.plotOf(row, farm.cropMap());
        if (plot == null) throw new IllegalStateException("Ô này đang trống.");
        Map<String, Object> crop = farm.cropMap().get((String) row.get("crop_key"));
        FarmRules.View v = FarmRules.view(plot, farm.now(), settings.params());
        boolean ripe = v.phase() == FarmRules.Phase.RIPE || v.phase() == FarmRules.Phase.WILTING;
        long minutes = v.ripeAt() == null ? 0 : Duration.between(v.ripeAt(), farm.now()).toMinutes();
        int stolenHere = ((Number) row.get("stolen")).intValue();
        Integer actorHere = jdbc.queryForObject("SELECT COUNT(*) FROM farm_social_log WHERE actor_id = ? AND owner_id = ? AND day = ? AND kind IN ('steal', 'caught')", Integer.class, userId, ownerId, FarmService.Date(farm.today()));
        String problem = FarmGameRules.stealProblem(crop != null && ((Number) crop.get("stealable")).intValue() == 1, ripe, minutes, settings.n("steal_grace_minutes"),
                stolenHere, v.yieldNow() - stolenHere, countToday("actor_id", userId, "steal") + countToday("actor_id", userId, "caught"),
                countToday("owner_id", ownerId, "steal"), ((Number) owner.get(0).get("allow_steal")).intValue() == 1, ((Number) me.get("allow_steal")).intValue() == 1,
                actorHere != null && actorHere > 0, limits());
        if (problem != null) throw new IllegalStateException(problem);
        Map<String, Object> out = new LinkedHashMap<>();
        boolean dog = ((Number) owner.get(0).get("has_dog")).intValue() == 1;
        if (dog && ThreadLocalRandom.current().nextInt(100) < settings.n("catch_chance")) {
            log(userId, ownerId, "caught", slot, (String) row.get("crop_key"), 0);
            out.put("caught", true);
            out.put("message", "Chó Bông đuổi bạn chạy mất dép! Bạn không hái được bông nào.");
            return out;
        }
        jdbc.update("UPDATE farm_plots SET stolen = stolen + 1 WHERE user_id = ? AND slot = ? AND stolen = ?", ownerId, slot, stolenHere);
        farm.addInventory(userId, (String) row.get("crop_key"), 1, true);
        log(userId, ownerId, "steal", slot, (String) row.get("crop_key"), 1);
        farm.bump(userId, "steal", 1);
        events.record(userId, GameEventService.GAME_FARM, "steal", (String) row.get("crop_key"), 0);
        out.put("caught", false);
        out.put("cropKey", row.get("crop_key"));
        out.put("message", "Bạn hái lén được 1 bông " + (crop == null ? "" : crop.get("name")) + ". Hoa này chỉ dùng cho đơn hàng, không bán được.");
        return out;
    }

    @Transactional
    public Map<String, Object> setAllowSteal(long userId, boolean allow) {
        farm.lockProfile(userId);
        jdbc.update("UPDATE farm_profiles SET allow_steal = ? WHERE user_id = ?", allow ? 1 : 0, userId);
        return Map.of("allowSteal", allow);
    }

    /** What happened in the player's farm today, for the evening summary: helps received, flowers picked, thieves caught. */
    public Map<String, Object> todaySummary(long ownerId) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("helped", countToday("owner_id", ownerId, "water") + countToday("owner_id", ownerId, "fertilize"));
        m.put("picked", countToday("owner_id", ownerId, "steal"));
        m.put("caught", countToday("owner_id", ownerId, "caught"));
        return m;
    }

    @SuppressWarnings("unused")
    private static Timestamp ts(LocalDateTime t) { return Timestamp.valueOf(t); }
}
