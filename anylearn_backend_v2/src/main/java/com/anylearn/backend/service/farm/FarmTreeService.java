package com.anylearn.backend.service.farm;

import com.anylearn.backend.service.fun.GameEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** The three perennial tree slots of Nông trại anyLEARN: plant once, pick fruit every cycle, uproot when the tree rests. */
@Service
@RequiredArgsConstructor
public class FarmTreeService {

    private final JdbcTemplate jdbc;
    private final FarmService farm;
    private final GameEventService events;

    private Map<String, Object> row(long userId, int slot) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM farm_trees WHERE user_id = ? AND slot = ?", userId, slot);
        return rows.isEmpty() ? null : rows.get(0);
    }

    /** The three slots for the garden view: unlocked or not, and what stands in each. */
    public List<Map<String, Object>> slots(long userId, int level) {
        LocalDateTime now = farm.now();
        Map<Integer, Map<String, Object>> rows = new LinkedHashMap<>();
        for (Map<String, Object> r : jdbc.queryForList("SELECT * FROM farm_trees WHERE user_id = ?", userId)) rows.put(((Number) r.get("slot")).intValue(), r);
        List<Map<String, Object>> out = new ArrayList<>();
        for (int slot = 0; slot < FarmTreeRules.SLOT_LEVELS.length; slot++) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("slot", slot);
            m.put("levelNeeded", FarmTreeRules.slotLevel(slot));
            m.put("unlocked", level >= FarmTreeRules.slotLevel(slot));
            Map<String, Object> r = rows.get(slot);
            if (r != null) {
                LocalDateTime next = FarmService.time(r.get("next_ready_at"));
                int done = ((Number) r.get("harvests_done")).intValue();
                int cycles = ((Number) r.get("cycles")).intValue();
                m.put("cropKey", r.get("crop_key"));
                m.put("phase", FarmTreeRules.phase(next, done, cycles, now).name().toLowerCase());
                m.put("secondsLeft", Math.max(Duration.between(now, next).getSeconds(), 0));
                m.put("harvestsDone", done);
                m.put("cycles", cycles);
            }
            out.add(m);
        }
        return out;
    }

    @Transactional
    public Map<String, Object> plant(long userId, int slot, String cropKey) {
        farm.checkOpen();
        Map<String, Object> profile = farm.lockProfile(userId);
        if (((Number) profile.get("level")).intValue() < FarmTreeRules.slotLevel(slot)) throw new IllegalStateException("Chỗ cây này mở ở cấp " + FarmTreeRules.slotLevel(slot) + ".");
        Map<String, Object> crop = farm.cropMap().get(cropKey);
        if (crop == null || !"tree".equals(crop.get("category")) || ((Number) crop.get("active")).intValue() != 1) throw new IllegalStateException("Đây không phải cây lâu năm.");
        if (row(userId, slot) != null) throw new IllegalStateException("Chỗ này đang có cây.");
        farm.spend(userId, ((Number) crop.get("seed_price")).intValue(), "Trồng " + crop.get("name"));
        LocalDateTime now = farm.now();
        jdbc.update("INSERT INTO farm_trees (user_id, slot, crop_key, planted_at, next_ready_at, harvests_done, cycles) VALUES (?, ?, ?, ?, ?, 0, ?)",
                userId, slot, cropKey, now, now.plusMinutes(((Number) crop.get("grow_minutes")).intValue()), crop.get("cycles"));
        farm.bump(userId, "plant", 1);
        events.record(userId, GameEventService.GAME_FARM, "tree_plant", cropKey, 0);
        return Map.of("planted", cropKey);
    }

    @Transactional
    public Map<String, Object> harvest(long userId, int slot) {
        farm.checkOpen();
        Map<String, Object> profile = farm.lockProfile(userId);
        Map<String, Object> r = row(userId, slot);
        if (r == null) throw new IllegalStateException("Chỗ này chưa có cây.");
        LocalDateTime now = farm.now();
        int done = ((Number) r.get("harvests_done")).intValue();
        int cycles = ((Number) r.get("cycles")).intValue();
        if (FarmTreeRules.phase(FarmService.time(r.get("next_ready_at")), done, cycles, now) != FarmTreeRules.Phase.FRUITING) throw new IllegalStateException("Cây chưa ra quả.");
        String key = (String) r.get("crop_key");
        Map<String, Object> crop = farm.cropMap().get(key);
        int yield = ((Number) crop.get("base_yield")).intValue();
        long xp = ((Number) crop.get("xp")).longValue();
        jdbc.update("UPDATE farm_trees SET harvests_done = harvests_done + 1, next_ready_at = ? WHERE user_id = ? AND slot = ?",
                now.plusMinutes(((Number) crop.get("cycle_minutes")).intValue()), userId, slot);
        farm.addInventory(userId, key, yield, false);
        farm.bump(userId, "harvest", 1);
        farm.bump(userId, "h:" + key, 1);
        events.record(userId, GameEventService.GAME_FARM, "tree_harvest", key, 0);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("harvested", Map.of(key, yield));
        out.put("xp", xp);
        out.put("level", ((Number) profile.get("level")).intValue());
        out.putAll(farm.gainXp(userId, xp));
        return out;
    }

    /** Uproots a tree that used all its cycles; the player gets one fertilizer and the slot is free again. */
    @Transactional
    public Map<String, Object> remove(long userId, int slot) {
        farm.checkOpen();
        farm.lockProfile(userId);
        Map<String, Object> r = row(userId, slot);
        if (r == null) throw new IllegalStateException("Chỗ này chưa có cây.");
        if (((Number) r.get("harvests_done")).intValue() < ((Number) r.get("cycles")).intValue()) throw new IllegalStateException("Cây vẫn còn ra quả, chưa nhổ được.");
        jdbc.update("DELETE FROM farm_trees WHERE user_id = ? AND slot = ?", userId, slot);
        farm.addInventory(userId, FarmService.FERTILIZER, 1, false);
        return Map.of("removed", true);
    }
}
