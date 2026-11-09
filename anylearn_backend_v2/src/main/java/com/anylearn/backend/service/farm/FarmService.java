package com.anylearn.backend.service.farm;

import com.anylearn.backend.service.fun.CoinService;
import com.anylearn.backend.service.fun.FunSettings;
import com.anylearn.backend.service.fun.GameEventService;
import com.anylearn.backend.service.mission.MissionRules;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Nông trại anyLEARN (plan 22.1/22.2): the player's plots, inventory and market. Every write locks the player's profile row, and
 * every Leo Xu movement goes through {@link CoinService}. Plot state is computed from time when read ({@link FarmRules}), no job.
 */
@Service
@RequiredArgsConstructor
public class FarmService {

    public static final String FERTILIZER = "fertilizer";
    private static final TypeReference<Map<String, Integer>> SOLD = new TypeReference<>() {};

    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final FarmSettings settings;
    private final CoinService coins;
    private final FunSettings funSettings;
    private final GameEventService events;
    private final ObjectMapper mapper;

    LocalDateTime now() { return LocalDateTime.now(clock); }

    // ---------------------------------------------------------------- profile

    /** Creates the profile on the first visit (with the starter seeds and fertilizer) and locks the row for the rest of the transaction. */
    Map<String, Object> lockProfile(long userId) {
        int created = jdbc.update("INSERT IGNORE INTO farm_profiles (user_id, last_visit_at) VALUES (?, ?)", userId, now());
        if (created == 1) {
            addInventory(userId, "seed:rau_mam", settings.n("starter_seeds"), false);
            addInventory(userId, "seed:ca_rot_cau_vong", settings.n("starter_seeds_carrot"), false);
            addInventory(userId, FERTILIZER, settings.n("starter_fertilizer"), false);
            events.record(userId, GameEventService.GAME_FARM, "start", null, 0);
        }
        return jdbc.queryForMap("SELECT level, xp, plots, allow_steal, has_dog, push_ignored FROM farm_profiles WHERE user_id = ? FOR UPDATE", userId);
    }

    /** A DATETIME read through queryForList is a LocalDateTime with the MySQL driver and a Timestamp with some others. */
    static LocalDateTime time(Object value) {
        if (value instanceof LocalDateTime t) return t;
        if (value instanceof Timestamp t) return t.toLocalDateTime();
        throw new IllegalStateException("Not a date time: " + value);
    }

    void addInventory(long userId, String key, int qty, boolean received) {
        if (qty <= 0) return;
        String column = received ? "qty_received" : "qty_own";
        jdbc.update("INSERT INTO farm_inventory (user_id, item_key, " + column + ") VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE " + column + " = " + column + " + VALUES(" + column + ")", userId, key, qty);
    }

    int ownOf(long userId, String key) {
        List<Integer> rows = jdbc.query("SELECT qty_own FROM farm_inventory WHERE user_id = ? AND item_key = ?", (rs, i) -> rs.getInt(1), userId, key);
        return rows.isEmpty() ? 0 : rows.get(0);
    }

    boolean takeOwn(long userId, String key, int qty) {
        return jdbc.update("UPDATE farm_inventory SET qty_own = qty_own - ? WHERE user_id = ? AND item_key = ? AND qty_own >= ?", qty, userId, key, qty) == 1;
    }

    private void spend(long userId, int amount, String detail) {
        if (amount <= 0) return;
        if (!coins.debit(userId, amount, CoinService.SOURCE_FARM_SEED, detail)) throw new IllegalStateException("Bạn chưa đủ " + funSettings.coinName() + ".");
        jdbc.update("INSERT INTO farm_day_stats (user_id, day, coins_spent) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE coins_spent = coins_spent + VALUES(coins_spent)", userId, Date(today()), amount);
    }

    static java.sql.Date Date(LocalDate d) { return java.sql.Date.valueOf(d); }

    LocalDate today() { return LocalDate.now(clock); }

    void checkOpen() {
        if (!settings.enabled()) throw new IllegalStateException("Nông trại đang tạm đóng.");
    }

    /** Adds to today's counter of a kind (drives daily tasks and chapter quests). */
    void bump(long userId, String kind, int n) {
        if (n <= 0) return;
        jdbc.update("INSERT INTO farm_counters (user_id, day, kind, n) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE n = n + VALUES(n)", userId, Date(today()), kind, n);
    }

    /** Adds XP, moves the level and pays the Leo Xu of every even level reached (a one-time reward, outside the profit cap). */
    Map<String, Object> gainXp(long userId, long xp) {
        Map<String, Object> out = new LinkedHashMap<>();
        Map<String, Object> p = jdbc.queryForMap("SELECT level, xp FROM farm_profiles WHERE user_id = ?", userId);
        int level = ((Number) p.get("level")).intValue();
        long total = ((Number) p.get("xp")).longValue() + Math.max(xp, 0);
        int newLevel = FarmRules.levelFor(total, settings.params());
        jdbc.update("UPDATE farm_profiles SET xp = ?, level = ? WHERE user_id = ?", total, newLevel, userId);
        long reward = 0;
        for (int l = level + 1; l <= newLevel; l++) if (l % 2 == 0) reward += (long) settings.n("level_coins") * l;
        if (reward > 0) coins.credit(userId, reward, CoinService.SOURCE_FARM_REWARD, "Lên cấp vườn " + newLevel);
        if (newLevel > level) events.record(userId, GameEventService.GAME_FARM, "level", String.valueOf(newLevel), (int) reward);
        out.put("levelUp", newLevel > level);
        out.put("level", newLevel);
        out.put("levelCoins", reward);
        return out;
    }

    // ---------------------------------------------------------------- read

    @Transactional
    public Map<String, Object> view(long userId) {
        checkOpen();
        Map<String, Object> profile = lockProfile(userId);
        jdbc.update("UPDATE farm_profiles SET last_visit_at = ? WHERE user_id = ?", now(), userId);
        int level = ((Number) profile.get("level")).intValue();
        int plotCount = ((Number) profile.get("plots")).intValue();
        FarmRules.Params params = settings.params();
        LocalDateTime now = now();

        Map<String, Map<String, Object>> crops = new LinkedHashMap<>();
        for (Map<String, Object> c : jdbc.queryForList("SELECT * FROM farm_crops WHERE active = 1 ORDER BY sort_order, crop_key")) crops.put((String) c.get("crop_key"), c);

        Map<Integer, Map<String, Object>> rows = new LinkedHashMap<>();
        for (Map<String, Object> r : jdbc.queryForList("SELECT * FROM farm_plots WHERE user_id = ?", userId)) rows.put(((Number) r.get("slot")).intValue(), r);

        List<Map<String, Object>> plots = new ArrayList<>();
        for (int slot = 0; slot < plotCount; slot++) {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("slot", slot);
            Map<String, Object> row = rows.get(slot);
            FarmRules.Plot plot = plotOf(row, crops);
            FarmRules.View v = FarmRules.view(plot, now, params);
            out.put("phase", v.phase().name().toLowerCase());
            if (row != null && row.get("crop_key") != null) {
                out.put("cropKey", row.get("crop_key"));
                out.put("fertilized", ((Number) row.get("fertilized")).intValue() == 1);
                out.put("watersDone", row.get("waters_done"));
                out.put("waterNeeds", row.get("water_needs"));
                out.put("yield", v.yieldNow());
                out.put("needsWater", v.needsWater());
                out.put("secondsToRipe", v.secondsToRipe());
                out.put("ripeAt", v.ripeAt() == null ? null : v.ripeAt().toString());
                out.put("nextWaterAt", v.nextWaterAt() == null ? null : v.nextWaterAt().toString());
            }
            plots.add(out);
        }

        Map<String, Integer> inventory = new LinkedHashMap<>();
        for (Map<String, Object> r : jdbc.queryForList("SELECT item_key, qty_own, qty_received FROM farm_inventory WHERE user_id = ? AND (qty_own > 0 OR qty_received > 0) ORDER BY item_key", userId)) {
            inventory.put((String) r.get("item_key"), ((Number) r.get("qty_own")).intValue() + ((Number) r.get("qty_received")).intValue());
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("serverNow", now.toString());
        out.put("coinName", funSettings.coinName());
        out.put("balance", coins.balance(userId));
        out.put("level", level);
        long xp = ((Number) profile.get("xp")).longValue();
        out.put("xp", xp);
        out.put("xpIntoLevel", xpIntoLevel(xp, level, params));
        out.put("xpForNext", level >= FarmRules.MAX_LEVEL ? 0 : FarmRules.xpForNext(level, params));
        out.put("plots", plots);
        out.put("inventory", inventory);
        out.put("crops", cropList(crops.values(), level));
        out.put("market", market(userId, crops, level));
        out.put("fertilizerPrice", settings.n("fertilizer_price"));
        out.put("allowSteal", ((Number) profile.get("allow_steal")).intValue() == 1);
        out.put("nextPlotPrice", FarmGameRules.plotPrice(plotCount));
        out.put("nextPlotLevel", FarmGameRules.plotLevel(plotCount));
        return out;
    }

    private long xpIntoLevel(long xp, int level, FarmRules.Params params) {
        long left = xp;
        for (int l = 1; l < level; l++) left -= FarmRules.xpForNext(l, params);
        return Math.max(left, 0);
    }

    FarmRules.Plot plotOf(Map<String, Object> row, Map<String, Map<String, Object>> crops) {
        if (row == null || row.get("crop_key") == null || row.get("planted_at") == null) return null;
        Map<String, Object> crop = crops.get((String) row.get("crop_key"));
        int baseYield = crop == null ? 4 : ((Number) crop.get("base_yield")).intValue();
        return new FarmRules.Plot(time(row.get("planted_at")), ((Number) row.get("grow_minutes")).intValue(),
                ((Number) row.get("water_needs")).intValue(), ((Number) row.get("waters_done")).intValue(), ((Number) row.get("missed_waters")).intValue(),
                ((Number) row.get("lost_seconds")).intValue(), ((Number) row.get("fertilized")).intValue() == 1, baseYield);
    }

    private List<Map<String, Object>> cropList(java.util.Collection<Map<String, Object>> crops, int level) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> c : crops) {
            Map<String, Object> m = new LinkedHashMap<>();
            for (String k : List.of("crop_key", "name", "category", "grow_minutes", "water_needs", "seed_price", "base_yield", "xp", "unlock_level", "stealable", "emoji", "image_url", "description")) m.put(camel(k), c.get(k));
            m.put("locked", ((Number) c.get("unlock_level")).intValue() > level);
            out.add(m);
        }
        return out;
    }

    private static String camel(String snake) {
        StringBuilder sb = new StringBuilder();
        boolean up = false;
        for (char ch : snake.toCharArray()) {
            if (ch == '_') { up = true; continue; }
            sb.append(up ? Character.toUpperCase(ch) : ch);
            up = false;
        }
        return sb.toString();
    }

    // ---------------------------------------------------------------- market

    private Map<String, Integer> soldToday(long userId) {
        List<String> rows = jdbc.query("SELECT sold_json FROM farm_day_stats WHERE user_id = ? AND day = ?", (rs, i) -> rs.getString(1), userId, Date(today()));
        if (rows.isEmpty() || rows.get(0) == null) return new LinkedHashMap<>();
        try { return new LinkedHashMap<>(mapper.readValue(rows.get(0), SOLD)); } catch (Exception e) { return new LinkedHashMap<>(); }
    }

    private int netOn(long userId, LocalDate from, LocalDate toExclusive) {
        Integer v = jdbc.queryForObject("SELECT COALESCE(SUM(coins_in - coins_spent), 0) FROM farm_day_stats WHERE user_id = ? AND day >= ? AND day < ?", Integer.class, userId, Date(from), Date(toExclusive));
        return v == null ? 0 : v;
    }

    int room(long userId, int level) {
        LocalDate day = today();
        int dayCap = FarmRules.dailyProfitCap(settings.n("profit_cap_base"), settings.n("profit_cap_per_2_levels"), settings.n("profit_cap_max"), level);
        int dayNet = netOn(userId, day, day.plusDays(1));
        int weekNet = netOn(userId, MissionRules.weekStart(day), MissionRules.weekEnd(day));
        return FarmRules.profitRoom(dayCap, dayNet, settings.n("weekly_profit_cap"), weekNet);
    }

    private Map<String, Object> market(long userId, Map<String, Map<String, Object>> crops, int level) {
        LocalDate day = today();
        Map<String, Integer> sold = soldToday(userId);
        List<Map<String, Object>> prices = new ArrayList<>();
        for (Map<String, Object> c : crops.values()) {
            String key = (String) c.get("crop_key");
            int price = FarmRules.dailyUnitPrice(((Number) c.get("unit_price")).intValue(), key, day, settings.n("price_jitter"));
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("cropKey", key);
            m.put("price", price);
            m.put("basePrice", c.get("unit_price"));
            m.put("soldToday", sold.getOrDefault(key, 0));
            m.put("nextPercent", FarmRules.pricePercent(sold.getOrDefault(key, 0), settings.n("same_crop_full_units"), settings.n("same_crop_step1"), settings.n("same_crop_step2")));
            prices.add(m);
        }
        int dayCap = FarmRules.dailyProfitCap(settings.n("profit_cap_base"), settings.n("profit_cap_per_2_levels"), settings.n("profit_cap_max"), level);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("prices", prices);
        out.put("room", room(userId, level));
        out.put("dayCap", dayCap);
        out.put("weekCap", settings.n("weekly_profit_cap"));
        return out;
    }

    // ---------------------------------------------------------------- actions

    Map<String, Map<String, Object>> cropMap() {
        Map<String, Map<String, Object>> crops = new LinkedHashMap<>();
        for (Map<String, Object> c : jdbc.queryForList("SELECT * FROM farm_crops")) crops.put((String) c.get("crop_key"), c);
        return crops;
    }

    Map<String, Object> plotRow(long userId, int slot) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM farm_plots WHERE user_id = ? AND slot = ?", userId, slot);
        return rows.isEmpty() ? null : rows.get(0);
    }

    @Transactional
    public Map<String, Object> plant(long userId, int slot, String cropKey) {
        checkOpen();
        Map<String, Object> profile = lockProfile(userId);
        if (slot < 0 || slot >= ((Number) profile.get("plots")).intValue()) throw new IllegalStateException("Ô đất này chưa mở.");
        Map<String, Object> crop = cropMap().get(cropKey);
        if (crop == null || ((Number) crop.get("active")).intValue() != 1) throw new IllegalStateException("Cây này chưa có.");
        if (((Number) crop.get("unlock_level")).intValue() > ((Number) profile.get("level")).intValue()) throw new IllegalStateException("Cần đạt cấp " + crop.get("unlock_level") + " để trồng cây này.");
        Map<String, Object> existing = plotRow(userId, slot);
        if (existing != null && existing.get("crop_key") != null) throw new IllegalStateException("Ô đất đang có cây.");
        boolean free = takeOwn(userId, "seed:" + cropKey, 1);
        if (!free && !"shop".equals(crop.get("seed_source"))) throw new IllegalStateException("Cây này chỉ trồng được từ Hạt Tri thức, nhận khi bé đi học hoặc học video.");
        if (!free) spend(userId, ((Number) crop.get("seed_price")).intValue(), "Hạt " + crop.get("name"));
        jdbc.update("INSERT INTO farm_plots (user_id, slot, crop_key, planted_at, grow_minutes, water_needs, waters_done, missed_waters, lost_seconds, fertilized) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0) "
                        + "ON DUPLICATE KEY UPDATE crop_key = VALUES(crop_key), planted_at = VALUES(planted_at), grow_minutes = VALUES(grow_minutes), water_needs = VALUES(water_needs), waters_done = 0, missed_waters = 0, lost_seconds = 0, fertilized = 0, stolen = 0",
                userId, slot, cropKey, now(), crop.get("grow_minutes"), crop.get("water_needs"));
        bump(userId, "plant", 1);
        if ("knowledge".equals(crop.get("seed_source"))) bump(userId, "plant_magic", 1);
        events.record(userId, GameEventService.GAME_FARM, "plant", cropKey, 0);
        return Map.of("planted", cropKey, "free", free);
    }

    @Transactional
    public Map<String, Object> water(long userId, List<Integer> slots) {
        checkOpen();
        lockProfile(userId);
        int watered = waterFor(userId, slots);
        bump(userId, "water", watered);
        if (watered > 0) events.record(userId, GameEventService.GAME_FARM, "water", String.valueOf(watered), 0);
        return Map.of("watered", watered);
    }

    /** Waters the thirsty plots of {@code ownerId} among {@code slots}; the update is conditional so two people never water the same time twice. */
    int waterFor(long ownerId, List<Integer> slots) {
        FarmRules.Params params = settings.params();
        LocalDateTime now = now();
        Map<String, Map<String, Object>> crops = cropMap();
        int watered = 0;
        for (int slot : slots) {
            Map<String, Object> row = plotRow(ownerId, slot);
            FarmRules.Plot plot = plotOf(row, crops);
            if (plot == null) continue;
            int next = plot.watersDone() + 1;
            if (next > plot.waterNeeds() || now.isBefore(FarmRules.checkpoint(plot, next))) continue;
            int lost = FarmRules.lostWhenWatered(plot, next, now, params);
            int missed = FarmRules.tooLate(plot, next, now, params) ? 1 : 0;
            int rows = jdbc.update("UPDATE farm_plots SET waters_done = waters_done + 1, lost_seconds = lost_seconds + ?, missed_waters = missed_waters + ? WHERE user_id = ? AND slot = ? AND waters_done = ?",
                    lost, missed, ownerId, slot, plot.watersDone());
            if (rows == 1) watered++;
        }
        return watered;
    }

    @Transactional
    public Map<String, Object> fertilize(long userId, int slot) {
        checkOpen();
        lockProfile(userId);
        Map<String, Map<String, Object>> crops = cropMap();
        Map<String, Object> row = plotRow(userId, slot);
        FarmRules.Plot plot = plotOf(row, crops);
        if (plot == null) throw new IllegalStateException("Ô đất đang trống.");
        FarmRules.View v = FarmRules.view(plot, now(), settings.params());
        if (v.phase() == FarmRules.Phase.RIPE || v.phase() == FarmRules.Phase.WILTING) throw new IllegalStateException("Cây đã chín, thu hoạch thôi!");
        if (plot.fertilized()) throw new IllegalStateException("Cây này đã được bón rồi.");
        if (!takeOwn(userId, FERTILIZER, 1)) throw new IllegalStateException("Bạn hết phân bón.");
        jdbc.update("UPDATE farm_plots SET fertilized = 1 WHERE user_id = ? AND slot = ?", userId, slot);
        bump(userId, "fertilize", 1);
        events.record(userId, GameEventService.GAME_FARM, "fertilize", null, 0);
        return Map.of("fertilized", true);
    }

    @Transactional
    public Map<String, Object> buyFertilizer(long userId, int qty) {
        checkOpen();
        lockProfile(userId);
        int n = Math.min(Math.max(qty, 1), 20);
        spend(userId, settings.n("fertilizer_price") * n, "Phân bón x" + n);
        addInventory(userId, FERTILIZER, n, false);
        return Map.of("bought", n);
    }

    @Transactional
    public Map<String, Object> harvest(long userId, List<Integer> slots) {
        checkOpen();
        Map<String, Object> profile = lockProfile(userId);
        FarmRules.Params params = settings.params();
        LocalDateTime now = now();
        Map<String, Map<String, Object>> crops = cropMap();
        Map<String, Integer> got = new LinkedHashMap<>();
        long xp = 0;
        int harvested = 0;
        for (int slot : slots) {
            Map<String, Object> row = plotRow(userId, slot);
            FarmRules.Plot plot = plotOf(row, crops);
            if (plot == null) continue;
            FarmRules.View v = FarmRules.view(plot, now, params);
            if (v.phase() != FarmRules.Phase.RIPE && v.phase() != FarmRules.Phase.WILTING) continue;
            String key = (String) row.get("crop_key");
            int stolen = ((Number) row.get("stolen")).intValue();
            got.merge(key, Math.max(v.yieldNow() - stolen, 1), Integer::sum);
            harvested++;
            xp += ((Number) crops.get(key).get("xp")).intValue();
            jdbc.update("UPDATE farm_plots SET crop_key = NULL, planted_at = NULL, grow_minutes = NULL, water_needs = 0, waters_done = 0, missed_waters = 0, lost_seconds = 0, fertilized = 0, stolen = 0 WHERE user_id = ? AND slot = ?", userId, slot);
        }
        for (Map.Entry<String, Integer> e : got.entrySet()) addInventory(userId, e.getKey(), e.getValue(), false);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("harvested", got);
        out.put("xp", xp);
        out.put("levelUp", false);
        out.put("level", ((Number) profile.get("level")).intValue());
        if (harvested > 0) {
            bump(userId, "harvest", harvested);
            events.record(userId, GameEventService.GAME_FARM, "harvest", got.toString(), 0);
            out.putAll(gainXp(userId, xp));
        }
        return out;
    }

    /** Sells crops the player grew. The market pays only up to the net-profit cap; what does not fit stays in the inventory. */
    @Transactional
    public Map<String, Object> sell(long userId, Map<String, Integer> items) {
        checkOpen();
        Map<String, Object> profile = lockProfile(userId);
        int level = ((Number) profile.get("level")).intValue();
        Map<String, Map<String, Object>> crops = cropMap();
        Map<String, Integer> sold = soldToday(userId);
        int room = room(userId, level);
        int total = 0;
        boolean capped = false;
        Map<String, Integer> soldNow = new LinkedHashMap<>();
        for (Map.Entry<String, Integer> e : items.entrySet()) {
            Map<String, Object> crop = crops.get(e.getKey());
            if (crop == null) continue;
            int want = Math.min(Math.max(e.getValue() == null ? 0 : e.getValue(), 0), ownOf(userId, e.getKey()));
            if (want == 0) continue;
            int price = FarmRules.dailyUnitPrice(((Number) crop.get("unit_price")).intValue(), e.getKey(), today(), settings.n("price_jitter"));
            int already = sold.getOrDefault(e.getKey(), 0);
            int[] each = new int[want];
            for (int k = 0; k < want; k++) {
                int pct = FarmRules.pricePercent(already + k, settings.n("same_crop_full_units"), settings.n("same_crop_step1"), settings.n("same_crop_step2"));
                each[k] = (int) Math.round(price * pct / 100.0);
            }
            int fit = FarmRules.unitsThatFit(each, room - total);
            if (fit < want) capped = true;
            if (fit == 0) continue;
            int pay = 0;
            for (int k = 0; k < fit; k++) pay += each[k];
            if (!takeOwn(userId, e.getKey(), fit)) continue;
            total += pay;
            soldNow.put(e.getKey(), fit);
            sold.merge(e.getKey(), fit, Integer::sum);
        }
        long before = coins.balance(userId);
        if (total > 0) coins.credit(userId, total, CoinService.SOURCE_FARM_SELL, "Bán nông sản " + soldNow);
        long paid = coins.balance(userId) - before;
        if (total > 0) {
            String json;
            try { json = mapper.writeValueAsString(sold); } catch (Exception ex) { json = "{}"; }
            jdbc.update("INSERT INTO farm_day_stats (user_id, day, coins_in, sold_json) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE coins_in = coins_in + VALUES(coins_in), sold_json = VALUES(sold_json)", userId, Date(today()), (int) paid, json);
            bump(userId, "sell", 1);
            events.record(userId, GameEventService.GAME_FARM, "sell", soldNow.toString(), (int) paid);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("sold", soldNow);
        out.put("coins", paid);
        out.put("capped", capped);
        return out;
    }
}
