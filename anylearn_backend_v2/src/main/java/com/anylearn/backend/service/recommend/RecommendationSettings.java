package com.anylearn.backend.service.recommend;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** The `recommend/*` rows of the configurations table: which kinds of suggestion are on, and how long "Không quan tâm" hides one. */
@Component
public class RecommendationSettings {

    public static final String KEY_SOURCES = "recommend/sources";
    public static final String KEY_DISMISS_DAYS = "recommend/dismiss_days";

    private final ConfigurationRepository configurationRepository;

    public RecommendationSettings(ConfigurationRepository configurationRepository) {
        this.configurationRepository = configurationRepository;
    }

    /** A stored list (even an empty one, "off") wins; a missing row means every source is on. */
    public List<String> sources() {
        Optional<Configuration> row = configurationRepository.findByKey(KEY_SOURCES);
        if (row.isEmpty()) return RecommendationRules.SOURCES;
        String value = row.get().getValue();
        return value == null || value.isBlank() ? List.of() : RecommendationRules.parseSources(value);
    }

    public int dismissDays() {
        return configurationRepository.findByKey(KEY_DISMISS_DAYS).map(Configuration::getValue).map(value -> {
            try {
                int days = Integer.parseInt(value.trim());
                return days >= 1 && days <= 365 ? days : RecommendationRules.DEFAULT_DISMISS_DAYS;
            } catch (NumberFormatException e) {
                return RecommendationRules.DEFAULT_DISMISS_DAYS;
            }
        }).orElse(RecommendationRules.DEFAULT_DISMISS_DAYS);
    }

    public Map<String, Object> current() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("recommendSources", sources());
        map.put("recommendDismissDays", dismissDays());
        return map;
    }

    /** Saves the fields present. Returns the problem to show, or null when saved. */
    public String save(Map<String, Object> body) {
        if (body.containsKey("recommendDismissDays")) {
            Integer days = body.get("recommendDismissDays") instanceof Number n ? n.intValue() : null;
            if (days == null || days < 1 || days > 365) return "Số ngày không nhắc lại phải từ 1 đến 365";
            write(KEY_DISMISS_DAYS, String.valueOf(days));
        }
        if (body.get("recommendSources") instanceof List<?> list) {
            List<String> sources = list.stream().map(String::valueOf).filter(RecommendationRules::validSource).distinct().toList();
            write(KEY_SOURCES, String.join(",", sources));
        }
        return null;
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
