package com.anylearn.backend.service.achievement;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** `achievement/*` rows of the configurations table, edited on the back office page "Banner thành tích". */
@Component
public class AchievementSettings {

    static final List<Integer> DEFAULT_STREAK_DAYS = List.of(7, 14, 30, 60, 100);

    private final ConfigurationRepository configurationRepository;

    public AchievementSettings(ConfigurationRepository configurationRepository) {
        this.configurationRepository = configurationRepository;
    }

    public boolean enabled() {
        return !"0".equals(read("achievement/enabled").map(String::trim).orElse("1"));
    }

    /** A type can be switched off on its own. */
    public boolean typeEnabled(String type) {
        return !"0".equals(read("achievement/type_" + type).map(String::trim).orElse("1"));
    }

    public List<Integer> streakDays() {
        return AchievementRules.parseMilestones(read("achievement/streak_days").orElse(null), DEFAULT_STREAK_DAYS);
    }

    /** Leo Xu for the first share of each banner (0 = off). */
    public int shareCoins() {
        return number("achievement/share_coins", 10, 0, 1000);
    }

    /** Paid shares per person per day. */
    public int shareDailyMax() {
        return number("achievement/share_daily_max", 2, 0, 20);
    }

    private int number(String key, int def, int min, int max) {
        try {
            return Math.min(Math.max(Integer.parseInt(read(key).orElse(String.valueOf(def)).trim()), min), max);
        } catch (NumberFormatException e) {
            return def;
        }
    }

    public Map<String, Object> asMap() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", enabled());
        Map<String, Object> types = new LinkedHashMap<>();
        for (String t : AchievementRules.TYPES) types.put(t, typeEnabled(t));
        out.put("types", types);
        out.put("streakDays", String.join(",", streakDays().stream().map(String::valueOf).toList()));
        out.put("shareCoins", shareCoins());
        out.put("shareDailyMax", shareDailyMax());
        return out;
    }

    /** Saves what is sent; returns a Vietnamese problem text or null. */
    public String save(Map<String, Object> body) {
        if (body.get("streakDays") instanceof String s && !s.isBlank() && AchievementRules.parseMilestones(s, null) == null) {
            return "Các mốc chuỗi ngày cần là số từ 2 đến 3650, cách nhau bằng dấu phẩy";
        }
        if (body.get("shareCoins") instanceof Number n && (n.intValue() < 0 || n.intValue() > 1000)) return "Xu thưởng chia sẻ phải từ 0 đến 1000";
        if (body.get("shareDailyMax") instanceof Number n && (n.intValue() < 0 || n.intValue() > 20)) return "Số lần thưởng chia sẻ mỗi ngày phải từ 0 đến 20";
        if (body.get("shareCoins") instanceof Number n) write("achievement/share_coins", String.valueOf(n.intValue()));
        if (body.get("shareDailyMax") instanceof Number n) write("achievement/share_daily_max", String.valueOf(n.intValue()));
        if (body.get("enabled") instanceof Boolean b) write("achievement/enabled", b ? "1" : "0");
        if (body.get("types") instanceof Map<?, ?> types) {
            for (String t : AchievementRules.TYPES) {
                if (types.get(t) instanceof Boolean b) write("achievement/type_" + t, b ? "1" : "0");
            }
        }
        if (body.get("streakDays") instanceof String s && !s.isBlank()) write("achievement/streak_days", s.replaceAll("\\s", ""));
        return null;
    }

    private Optional<String> read(String key) {
        return configurationRepository.findByKey(key).map(Configuration::getValue).filter(v -> v != null && !v.isBlank());
    }

    private void write(String key, String value) {
        Configuration row = configurationRepository.findByKey(key).orElseGet(() -> {
            Configuration created = new Configuration();
            created.setKey(key);
            created.setType("text");
            created.setCreatedAt(LocalDateTime.now());
            return created;
        });
        row.setValue(value);
        row.setUpdatedAt(LocalDateTime.now());
        configurationRepository.save(row);
    }
}
