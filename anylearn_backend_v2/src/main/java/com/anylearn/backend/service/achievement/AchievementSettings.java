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

    public Map<String, Object> asMap() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", enabled());
        Map<String, Object> types = new LinkedHashMap<>();
        for (String t : AchievementRules.TYPES) types.put(t, typeEnabled(t));
        out.put("types", types);
        out.put("streakDays", String.join(",", streakDays().stream().map(String::valueOf).toList()));
        return out;
    }

    /** Saves what is sent; returns a Vietnamese problem text or null. */
    public String save(Map<String, Object> body) {
        if (body.get("streakDays") instanceof String s && !s.isBlank() && AchievementRules.parseMilestones(s, null) == null) {
            return "Các mốc chuỗi ngày cần là số từ 2 đến 3650, cách nhau bằng dấu phẩy";
        }
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
