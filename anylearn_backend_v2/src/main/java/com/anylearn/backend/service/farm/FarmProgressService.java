package com.anylearn.backend.service.farm;

import com.anylearn.backend.service.fun.CoinService;
import com.anylearn.backend.service.fun.FunSettings;
import com.anylearn.backend.service.fun.GameEventService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/** Compost, plots to buy, orders, daily tasks and chapters of Nông trại anyLEARN (plan 22.3 / 22.4). */
@Service
@RequiredArgsConstructor
public class FarmProgressService {

    private static final TypeReference<Map<String, Integer>> ITEMS = new TypeReference<>() {};
    public static final String KNOWLEDGE_CROP = "cay_tri_thuc";

    private final JdbcTemplate jdbc;
    private final FarmService farm;
    private final FarmSettings settings;
    private final CoinService coins;
    private final FunSettings funSettings;
    private final GameEventService events;
    private final ObjectMapper mapper;

    // ---------------------------------------------------------------- numbers

    private Map<String, Integer> counters(long userId, LocalDate day) {
        Map<String, Integer> out = new LinkedHashMap<>();
        String sql = day == null ? "SELECT kind, SUM(n) FROM farm_counters WHERE user_id = ? GROUP BY kind" : "SELECT kind, SUM(n) FROM farm_counters WHERE user_id = ? AND day = ? GROUP BY kind";
        Object[] args = day == null ? new Object[]{userId} : new Object[]{userId, FarmService.Date(day)};
        jdbc.query(sql, rs -> { out.put(rs.getString(1), rs.getInt(2)); }, args);
        return out;
    }

    private int distinctDays(long userId) {
        Integer v = jdbc.queryForObject("SELECT COUNT(DISTINCT day) FROM farm_counters WHERE user_id = ?", Integer.class, userId);
        return v == null ? 0 : v;
    }

    private int neighbors(long userId) {
        Integer v = jdbc.queryForObject("SELECT COUNT(*) FROM farm_neighbors WHERE user_id = ?", Integer.class, userId);
        return v == null ? 0 : v;
    }

    private boolean claimed(long userId, String key) {
        Integer v = jdbc.queryForObject("SELECT COUNT(*) FROM farm_claims WHERE user_id = ? AND claim_key = ?", Integer.class, userId, key);
        return v != null && v > 0;
    }

    /** Claims once; false when it was already claimed. */
    private boolean claim(long userId, String key) {
        return jdbc.update("INSERT IGNORE INTO farm_claims (user_id, claim_key) VALUES (?, ?)", userId, key) == 1;
    }

    /** Pays coins that count as profit (inside the daily and weekly cap): at most what is left of the room. Returns what was paid. */
    private long payInsideCap(long userId, int level, int wanted, String source, String detail) {
        int room = farm.room(userId, level);
        int pay = Math.min(wanted, room);
        if (pay <= 0) return 0;
        long before = coins.balance(userId);
        coins.credit(userId, pay, source, detail);
        long paid = coins.balance(userId) - before;
        if (paid > 0) jdbc.update("INSERT INTO farm_day_stats (user_id, day, coins_in) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE coins_in = coins_in + VALUES(coins_in)", userId, FarmService.Date(farm.today()), (int) paid);
        return paid;
    }

    // ---------------------------------------------------------------- Knowledge seed

    /** Gives today's Knowledge seed when a learner of the account attended a class or finished a video lesson today. */
    private void grantKnowledgeSeed(long userId) {
        int max = settings.n("knowledge_seeds_daily");
        if (max <= 0) return;
        Integer given = jdbc.query("SELECT knowledge_seed FROM farm_day_stats WHERE user_id = ? AND day = ?", rs -> rs.next() ? rs.getInt(1) : 0, userId, FarmService.Date(farm.today()));
        if (given != null && given >= max) return;
        Integer attended = jdbc.queryForObject("SELECT COUNT(*) FROM session_attendances sa JOIN users u ON u.id = sa.learner_id WHERE (u.id = ? OR u.user_id = ?) AND sa.session_date = ? AND sa.status = 'attended'",
                Integer.class, userId, userId, FarmService.Date(farm.today()));
        Integer watched = jdbc.queryForObject("SELECT COUNT(*) FROM item_video_lesson_user_links l JOIN users u ON u.id = l.learner_id WHERE (u.id = ? OR u.user_id = ?) AND l.completed_at >= ?",
                Integer.class, userId, userId, (farm.today().atStartOfDay()));
        if ((attended == null ? 0 : attended) + (watched == null ? 0 : watched) == 0) return;
        farm.addInventory(userId, "seed:" + KNOWLEDGE_CROP, 1, false);
        jdbc.update("INSERT INTO farm_day_stats (user_id, day, knowledge_seed) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE knowledge_seed = knowledge_seed + 1", userId, FarmService.Date(farm.today()));
        events.record(userId, GameEventService.GAME_FARM, "knowledge_seed", null, 0);
    }

    // ---------------------------------------------------------------- the whole progress view

    @Transactional
    public Map<String, Object> progress(long userId) {
        farm.checkOpen();
        Map<String, Object> profile = farm.lockProfile(userId);
        grantKnowledgeSeed(userId);
        int level = ((Number) profile.get("level")).intValue();
        int plots = ((Number) profile.get("plots")).intValue();
        LocalDate today = farm.today();
        Map<String, Integer> life = counters(userId, null);
        Map<String, Integer> day = counters(userId, today);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("serverNow", farm.now().toString());
        out.put("hasDog", ((Number) profile.get("has_dog")).intValue() == 1);
        out.put("orders", orders(userId, level));
        out.put("tasks", tasks(userId, today, day));
        out.put("chapters", chapters(userId, level, plots, life));
        out.put("compost", compost(userId));
        out.put("neighbors", neighbors(userId));
        return out;
    }

    // ---------------------------------------------------------------- compost

    private Map<String, Object> compost(long userId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT id, ready_at FROM farm_compost WHERE user_id = ? AND collected_at IS NULL ORDER BY id LIMIT 1", userId);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("units", settings.n("compost_units"));
        out.put("minutes", settings.n("compost_minutes"));
        if (rows.isEmpty()) { out.put("active", null); return out; }
        Map<String, Object> r = new LinkedHashMap<>();
        LocalDateTime ready = FarmService.time(rows.get(0).get("ready_at"));
        r.put("id", rows.get(0).get("id"));
        r.put("readyAt", ready.toString());
        r.put("ready", !farm.now().isBefore(ready));
        out.put("active", r);
        return out;
    }

    @Transactional
    public Map<String, Object> startCompost(long userId, String cropKey) {
        farm.checkOpen();
        farm.lockProfile(userId);
        if (compost(userId).get("active") != null) throw new IllegalStateException("Thùng ủ đang bận.");
        int units = settings.n("compost_units");
        if (cropKey == null || !farm.cropMap().containsKey(cropKey)) throw new IllegalStateException("Chọn một loại nông sản để ủ.");
        if (!farm.takeOwn(userId, cropKey, units)) throw new IllegalStateException("Cần " + units + " quả cùng loại để ủ 1 mẻ phân.");
        jdbc.update("INSERT INTO farm_compost (user_id, ready_at) VALUES (?, ?)", userId, (farm.now().plusMinutes(settings.n("compost_minutes"))));
        farm.bump(userId, "compost", 1);
        events.record(userId, GameEventService.GAME_FARM, "compost", cropKey, 0);
        return Map.of("started", true);
    }

    @Transactional
    public Map<String, Object> collectCompost(long userId) {
        farm.checkOpen();
        farm.lockProfile(userId);
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT id, ready_at FROM farm_compost WHERE user_id = ? AND collected_at IS NULL ORDER BY id LIMIT 1", userId);
        if (rows.isEmpty()) throw new IllegalStateException("Chưa có mẻ phân nào.");
        if (farm.now().isBefore(FarmService.time(rows.get(0).get("ready_at")))) throw new IllegalStateException("Phân chưa ủ xong.");
        jdbc.update("UPDATE farm_compost SET collected_at = ? WHERE id = ?", (farm.now()), rows.get(0).get("id"));
        farm.addInventory(userId, FarmService.FERTILIZER, 1, false);
        return Map.of("fertilizer", 1);
    }

    // ---------------------------------------------------------------- plots

    @Transactional
    public Map<String, Object> expand(long userId) {
        farm.checkOpen();
        Map<String, Object> profile = farm.lockProfile(userId);
        int plots = ((Number) profile.get("plots")).intValue();
        int price = FarmGameRules.plotPrice(plots);
        if (price < 0 || plots >= FarmGameRules.MAX_PLOTS) throw new IllegalStateException("Bạn đã mở hết ô đất.");
        if (((Number) profile.get("level")).intValue() < FarmGameRules.plotLevel(plots)) throw new IllegalStateException("Cần đạt cấp " + FarmGameRules.plotLevel(plots) + " để mở ô này.");
        if (!coins.debit(userId, price, CoinService.SOURCE_FARM_EXPAND, "Mở ô đất " + (plots + 1))) throw new IllegalStateException("Bạn chưa đủ " + funSettings.coinName() + ".");
        jdbc.update("UPDATE farm_profiles SET plots = plots + 1 WHERE user_id = ?", userId);
        events.record(userId, GameEventService.GAME_FARM, "expand", String.valueOf(plots + 1), 0);
        return Map.of("plots", plots + 1);
    }

    // ---------------------------------------------------------------- orders

    private List<Map<String, Object>> orders(long userId, int level) {
        int slots = FarmGameRules.orderSlots(level);
        LocalDateTime now = farm.now();
        List<Map<String, Object>> open = jdbc.queryForList("SELECT * FROM farm_orders WHERE user_id = ? AND status = 'open' ORDER BY slot", userId);
        List<FarmGameRules.CropInfo> unlocked = new ArrayList<>();
        for (Map<String, Object> c : jdbc.queryForList("SELECT crop_key, unit_price, xp, base_yield FROM farm_crops WHERE active = 1 AND unlock_level <= ?", level)) {
            unlocked.add(new FarmGameRules.CropInfo((String) c.get("crop_key"), ((Number) c.get("unit_price")).intValue(), ((Number) c.get("xp")).intValue(), ((Number) c.get("base_yield")).intValue()));
        }
        for (int slot = 0; slot < slots && !unlocked.isEmpty(); slot++) {
            final int s = slot;
            if (open.stream().anyMatch(o -> ((Number) o.get("slot")).intValue() == s)) continue;
            LocalDateTime last = jdbc.query("SELECT MAX(done_at) FROM farm_orders WHERE user_id = ? AND slot = ?", rs -> rs.next() ? rs.getObject(1, LocalDateTime.class) : null, userId, slot);
            if (last != null && last.plusMinutes(settings.n("order_refill_minutes")).isAfter(now)) continue;
            FarmGameRules.Order o = FarmGameRules.newOrder(userId * 31L + slot * 1_000_003L + now.toEpochSecond(ZoneOffset.UTC), unlocked, settings.n("order_coin_percent"));
            String json;
            try { json = mapper.writeValueAsString(o.items()); } catch (Exception e) { continue; }
            jdbc.update("INSERT INTO farm_orders (user_id, slot, items_json, xp, coins, created_at) VALUES (?, ?, ?, ?, ?, ?)", userId, slot, json, o.xp(), o.coins(), (now));
        }
        open = jdbc.queryForList("SELECT * FROM farm_orders WHERE user_id = ? AND status = 'open' ORDER BY slot", userId);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> o : open) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", o.get("id"));
            m.put("slot", o.get("slot"));
            m.put("xp", o.get("xp"));
            m.put("coins", o.get("coins"));
            try { m.put("items", mapper.readValue((String) o.get("items_json"), ITEMS)); } catch (Exception e) { m.put("items", Map.of()); }
            out.add(m);
        }
        return out;
    }

    /** Takes units from what the player received first, then from what they grew. */
    private boolean takeAny(long userId, String key, int qty) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT qty_own, qty_received FROM farm_inventory WHERE user_id = ? AND item_key = ?", userId, key);
        if (rows.isEmpty()) return false;
        int own = ((Number) rows.get(0).get("qty_own")).intValue();
        int got = ((Number) rows.get(0).get("qty_received")).intValue();
        if (own + got < qty) return false;
        int fromGot = Math.min(got, qty);
        jdbc.update("UPDATE farm_inventory SET qty_received = qty_received - ?, qty_own = qty_own - ? WHERE user_id = ? AND item_key = ?", fromGot, qty - fromGot, userId, key);
        return true;
    }

    @Transactional
    public Map<String, Object> deliver(long userId, long orderId) {
        farm.checkOpen();
        Map<String, Object> profile = farm.lockProfile(userId);
        int level = ((Number) profile.get("level")).intValue();
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM farm_orders WHERE id = ? AND user_id = ? AND status = 'open'", orderId, userId);
        if (rows.isEmpty()) throw new IllegalStateException("Đơn này không còn nữa.");
        Map<String, Integer> items;
        try { items = mapper.readValue((String) rows.get(0).get("items_json"), ITEMS); } catch (Exception e) { throw new IllegalStateException("Đơn hỏng."); }
        for (Map.Entry<String, Integer> e : items.entrySet()) {
            Integer have = jdbc.query("SELECT qty_own + qty_received FROM farm_inventory WHERE user_id = ? AND item_key = ?", rs -> rs.next() ? rs.getInt(1) : 0, userId, e.getKey());
            if (have == null || have < e.getValue()) throw new IllegalStateException("Chưa đủ nông sản cho đơn này.");
        }
        for (Map.Entry<String, Integer> e : items.entrySet()) takeAny(userId, e.getKey(), e.getValue());
        jdbc.update("UPDATE farm_orders SET status = 'done', done_at = ? WHERE id = ?", (farm.now()), orderId);
        long paid = payInsideCap(userId, level, ((Number) rows.get(0).get("coins")).intValue(), CoinService.SOURCE_FARM_ORDER, "Giao đơn hàng");
        farm.bump(userId, "order", 1);
        Map<String, Object> out = new LinkedHashMap<>(farm.gainXp(userId, ((Number) rows.get(0).get("xp")).longValue()));
        if (paid == 0) farm.addInventory(userId, FarmService.FERTILIZER, 1, false);
        out.put("coins", paid);
        out.put("xp", rows.get(0).get("xp"));
        out.put("capped", paid == 0);
        events.record(userId, GameEventService.GAME_FARM, "order", items.toString(), (int) paid);
        return out;
    }

    @Transactional
    public Map<String, Object> skipOrder(long userId, long orderId) {
        farm.checkOpen();
        farm.lockProfile(userId);
        int rows = jdbc.update("UPDATE farm_orders SET status = 'skipped', done_at = ? WHERE id = ? AND user_id = ? AND status = 'open'", (farm.now()), orderId, userId);
        if (rows != 1) throw new IllegalStateException("Đơn này không còn nữa.");
        return Map.of("skipped", true);
    }

    // ---------------------------------------------------------------- daily tasks

    private Map<String, Object> tasks(long userId, LocalDate day, Map<String, Integer> today) {
        List<FarmGameRules.TaskDef> defs = FarmGameRules.tasksFor(userId, day, neighbors(userId) > 0);
        List<Map<String, Object>> rows = new ArrayList<>();
        int done = 0;
        for (int i = 0; i < defs.size(); i++) {
            FarmGameRules.TaskDef d = defs.get(i);
            int progress = Math.min(today.getOrDefault(d.kind(), 0), d.target());
            boolean claimed = claimed(userId, "task:" + day + ":" + i);
            if (claimed) done++;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("index", i);
            m.put("label", d.label());
            m.put("progress", progress);
            m.put("target", d.target());
            m.put("claimed", claimed);
            m.put("claimable", !claimed && progress >= d.target());
            rows.add(m);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", rows);
        out.put("xp", FarmGameRules.TASK_XP);
        out.put("boxClaimed", claimed(userId, "taskbox:" + day));
        out.put("boxReady", done == defs.size() && !defs.isEmpty() && !claimed(userId, "taskbox:" + day));
        out.put("boxMin", settings.n("task_box_min"));
        out.put("boxMax", settings.n("task_box_max"));
        return out;
    }

    @Transactional
    public Map<String, Object> claimTask(long userId, int index) {
        farm.checkOpen();
        farm.lockProfile(userId);
        LocalDate day = farm.today();
        List<FarmGameRules.TaskDef> defs = FarmGameRules.tasksFor(userId, day, neighbors(userId) > 0);
        if (index < 0 || index >= defs.size()) throw new IllegalStateException("Không có việc này.");
        FarmGameRules.TaskDef d = defs.get(index);
        if (counters(userId, day).getOrDefault(d.kind(), 0) < d.target()) throw new IllegalStateException("Chưa làm xong việc này.");
        if (!claim(userId, "task:" + day + ":" + index)) throw new IllegalStateException("Bạn đã nhận việc này rồi.");
        farm.addInventory(userId, FarmService.FERTILIZER, 1, false);
        Map<String, Object> out = new LinkedHashMap<>(farm.gainXp(userId, FarmGameRules.TASK_XP));
        out.put("xp", FarmGameRules.TASK_XP);
        return out;
    }

    @Transactional
    public Map<String, Object> claimTaskBox(long userId) {
        farm.checkOpen();
        Map<String, Object> profile = farm.lockProfile(userId);
        LocalDate day = farm.today();
        List<FarmGameRules.TaskDef> defs = FarmGameRules.tasksFor(userId, day, neighbors(userId) > 0);
        for (int i = 0; i < defs.size(); i++) if (!claimed(userId, "task:" + day + ":" + i)) throw new IllegalStateException("Nhận đủ 3 việc hôm nay trước nhé.");
        if (!claim(userId, "taskbox:" + day)) throw new IllegalStateException("Bạn đã mở hộp quà hôm nay rồi.");
        int min = settings.n("task_box_min");
        int max = Math.max(settings.n("task_box_max"), min);
        int wanted = min + new Random(userId * 7L + day.toEpochDay()).nextInt(max - min + 1);
        long paid = payInsideCap(userId, ((Number) profile.get("level")).intValue(), wanted, CoinService.SOURCE_FARM_ORDER, "Hộp quà việc hôm nay");
        return Map.of("coins", paid, "capped", paid < wanted);
    }

    // ---------------------------------------------------------------- chapters

    private int progressOf(FarmGameRules.Quest q, long userId, int level, int plots, Map<String, Integer> life) {
        return switch (q.kind()) {
            case "level" -> level;
            case "plots" -> plots;
            case "days" -> distinctDays(userId);
            case "neighbors" -> neighbors(userId);
            default -> life.getOrDefault(q.kind(), 0);
        };
    }

    private List<Map<String, Object>> chapters(long userId, int level, int plots, Map<String, Integer> life) {
        List<Map<String, Object>> out = new ArrayList<>();
        boolean previous = true;
        for (FarmGameRules.Chapter c : FarmGameRules.CHAPTERS) {
            boolean claimed = claimed(userId, "chapter:" + c.no());
            boolean open = FarmGameRules.chapterOpen(c, level, previous);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("no", c.no());
            m.put("title", c.title());
            m.put("story", c.story());
            m.put("unlockLevel", c.unlockLevel());
            m.put("open", open);
            m.put("claimed", claimed);
            m.put("coins", c.coins());
            m.put("reward", (c.dog() ? "Chó Bông canh vườn" : "") + (c.freePlot() ? (c.dog() ? ", " : "") + "1 ô đất miễn phí" : ""));
            boolean all = true;
            List<Map<String, Object>> quests = new ArrayList<>();
            for (FarmGameRules.Quest q : c.quests()) {
                int p = open ? Math.min(progressOf(q, userId, level, plots, life), q.target()) : 0;
                if (p < q.target()) all = false;
                Map<String, Object> qm = new LinkedHashMap<>();
                qm.put("label", q.label());
                qm.put("progress", p);
                qm.put("target", q.target());
                quests.add(qm);
            }
            m.put("quests", quests);
            m.put("claimable", open && !claimed && all);
            out.add(m);
            previous = claimed;
        }
        return out;
    }

    @Transactional
    public Map<String, Object> claimChapter(long userId, int no) {
        farm.checkOpen();
        Map<String, Object> profile = farm.lockProfile(userId);
        FarmGameRules.Chapter c = FarmGameRules.chapter(no);
        if (c == null) throw new IllegalStateException("Không có chương này.");
        int level = ((Number) profile.get("level")).intValue();
        int plots = ((Number) profile.get("plots")).intValue();
        boolean previous = no == 1 || claimed(userId, "chapter:" + (no - 1));
        if (!FarmGameRules.chapterOpen(c, level, previous)) throw new IllegalStateException("Chương này chưa mở.");
        Map<String, Integer> life = counters(userId, null);
        for (FarmGameRules.Quest q : c.quests()) if (progressOf(q, userId, level, plots, life) < q.target()) throw new IllegalStateException("Còn nhiệm vụ chưa xong.");
        if (!claim(userId, "chapter:" + no)) throw new IllegalStateException("Bạn đã nhận chương này rồi.");
        if (c.coins() > 0) coins.credit(userId, c.coins(), CoinService.SOURCE_FARM_REWARD, "Hoàn thành chương " + no + ": " + c.title());
        if (c.freePlot() && plots < FarmGameRules.MAX_PLOTS) jdbc.update("UPDATE farm_profiles SET plots = plots + 1 WHERE user_id = ?", userId);
        if (c.dog()) jdbc.update("UPDATE farm_profiles SET has_dog = 1 WHERE user_id = ?", userId);
        events.record(userId, GameEventService.GAME_FARM, "chapter", String.valueOf(no), c.coins());
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("coins", c.coins());
        out.put("freePlot", c.freePlot());
        out.put("dog", c.dog());
        return out;
    }
}
