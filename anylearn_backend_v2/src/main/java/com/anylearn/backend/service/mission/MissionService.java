package com.anylearn.backend.service.mission;

import com.anylearn.backend.service.fun.CoinService;
import com.anylearn.backend.service.fun.FunSettings;
import com.anylearn.backend.service.fun.GameEventService;
import com.anylearn.backend.service.sticker.StickerService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Weekly missions (plan 15, section 6). Progress is read from `game_events` of the current ISO week (Monday 00:00 in the
 * app's clock), so nothing is counted twice anywhere. A claim is one row of `fun_mission_claims` (user + week + mission key), so
 * a mission pays once per week; the weekly bonus (a free sticker) is the same table with key `bonus`.
 */
@Service
@RequiredArgsConstructor
public class MissionService {

    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final MissionSettings settings;
    private final CoinService coins;
    private final FunSettings funSettings;
    private final StickerService stickers;
    private final GameEventService events;

    private LocalDate today() {
        return LocalDate.now(clock);
    }

    long progress(long userId, MissionRules.Def def, LocalDate day) {
        LocalDateTime from = MissionRules.weekStart(day).atStartOfDay();
        LocalDateTime to = MissionRules.weekEnd(day).atStartOfDay();
        StringBuilder sql = new StringBuilder("SELECT COUNT(").append(def.distinctDays() ? "DISTINCT DATE(created_at)" : "*")
                .append(") FROM game_events WHERE user_id = ? AND game = ? AND created_at >= ? AND created_at < ? AND type IN (");
        List<Object> args = new ArrayList<>(List.of(userId, def.game(), from, to));
        for (int i = 0; i < def.types().size(); i++) {
            sql.append(i == 0 ? "?" : ", ?");
            args.add(def.types().get(i));
        }
        sql.append(")");
        if (def.detailPrefix() != null) {
            sql.append(" AND detail LIKE ?");
            args.add(def.detailPrefix() + "%");
        }
        Long n = jdbc.queryForObject(sql.toString(), Long.class, args.toArray());
        return n == null ? 0 : n;
    }

    private List<String> claimedKeys(long userId, String weekKey) {
        return jdbc.query("SELECT mission_key FROM fun_mission_claims WHERE user_id = ? AND week_key = ?", (rs, i) -> rs.getString(1), userId, weekKey);
    }

    /** The missions of this week with the player's progress. */
    public Map<String, Object> view(long userId) {
        LocalDate day = today();
        String weekKey = MissionRules.weekKey(day);
        List<String> claimed = claimedKeys(userId, weekKey);
        List<Map<String, Object>> list = new ArrayList<>();
        int completed = 0;
        for (MissionRules.Def d : MissionRules.DEFS) {
            if (!settings.enabled(d.key())) continue;
            int target = settings.target(d.key());
            long count = progress(userId, d, day);
            if (MissionRules.complete(count, target)) completed++;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("key", d.key());
            m.put("label", d.label());
            m.put("target", target);
            m.put("progress", MissionRules.shown(count, target));
            m.put("reward", settings.reward(d.key()));
            m.put("claimed", claimed.contains(d.key()));
            list.add(m);
        }
        int needed = MissionRules.bonusNeeded(settings.bonusNeeded(), list.size());
        boolean bonusClaimed = claimed.contains(MissionRules.BONUS);
        Map<String, Object> bonus = new LinkedHashMap<>();
        bonus.put("needed", needed);
        bonus.put("done", completed);
        bonus.put("ready", MissionRules.bonusReady(completed, needed, bonusClaimed));
        bonus.put("claimed", bonusClaimed);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("coinName", funSettings.coinName());
        out.put("weekKey", weekKey);
        out.put("endsAt", MissionRules.weekEnd(day).atStartOfDay(clock.getZone()).toInstant().toString());
        out.put("missions", list);
        out.put("bonus", bonus);
        return out;
    }

    /** Pays one mission (or the bonus when {@code key} is "bonus"). Failures are {@link IllegalStateException} with a Vietnamese text. */
    @Transactional
    public Map<String, Object> claim(long userId, String key) {
        LocalDate day = today();
        String weekKey = MissionRules.weekKey(day);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("coinName", funSettings.coinName());
        if (MissionRules.BONUS.equals(key)) {
            Map<?, ?> bonus = (Map<?, ?>) view(userId).get("bonus");
            if (Boolean.TRUE.equals(bonus.get("claimed"))) throw new IllegalStateException("Bạn đã nhận sticker thưởng tuần này rồi");
            if (!Boolean.TRUE.equals(bonus.get("ready"))) throw new IllegalStateException("Chưa đủ nhiệm vụ để nhận sticker thưởng");
            if (jdbc.update("INSERT IGNORE INTO fun_mission_claims (user_id, week_key, mission_key, coins) VALUES (?, ?, ?, 0)", userId, weekKey, MissionRules.BONUS) != 1) {
                throw new IllegalStateException("Bạn đã nhận sticker thưởng tuần này rồi");
            }
            Map<String, Object> sticker = stickers.dropRandom(userId, "mission", weekKey);
            if (sticker == null) throw new IllegalStateException("Hiện chưa có sticker để tặng, bạn quay lại sau nhé");
            events.record(userId, GameEventService.GAME_COIN, "mission_bonus", weekKey + " " + sticker.get("name"), 0);
            out.put("sticker", sticker);
            out.put("coins", 0);
            return out;
        }
        MissionRules.Def def = MissionRules.find(key);
        if (def == null || !settings.enabled(def.key())) throw new IllegalStateException("Nhiệm vụ này không có");
        if (!MissionRules.complete(progress(userId, def, day), settings.target(def.key()))) throw new IllegalStateException("Bạn chưa hoàn thành nhiệm vụ này");
        int reward = settings.reward(def.key());
        if (jdbc.update("INSERT IGNORE INTO fun_mission_claims (user_id, week_key, mission_key, coins) VALUES (?, ?, ?, ?)", userId, weekKey, def.key(), reward) != 1) {
            throw new IllegalStateException("Bạn đã nhận thưởng nhiệm vụ này rồi");
        }
        coins.credit(userId, reward, CoinService.SOURCE_MISSION, "Nhiệm vụ tuần: " + def.label());
        events.record(userId, GameEventService.GAME_COIN, "mission", weekKey + " " + def.key(), reward);
        out.put("coins", reward);
        out.put("balance", coins.balance(userId));
        return out;
    }
}
