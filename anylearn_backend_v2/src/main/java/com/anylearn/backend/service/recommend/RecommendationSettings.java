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

    public static final String KEY_AI_ENABLED = "recommend/ai_enabled";
    public static final String KEY_AI_CANDIDATES = "recommend/ai_candidates";
    public static final String KEY_AI_RESULTS = "recommend/ai_results";

    public static final int DEFAULT_AI_CANDIDATES = 50;
    public static final int DEFAULT_AI_RESULTS = 12;

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

    /** AI suggestions are on unless an admin switched them off (a missing API key turns them off as well, see AiSuggestionService). */
    public boolean aiEnabled() {
        return configurationRepository.findByKey(KEY_AI_ENABLED).map(Configuration::getValue).map(v -> !"0".equals(v.trim())).orElse(true);
    }

    /** How many courses the rule engine sends to the AI. */
    public int aiCandidates() {
        return boundedInt(KEY_AI_CANDIDATES, DEFAULT_AI_CANDIDATES, 10, 100);
    }

    /** How many courses the AI returns to the parent. */
    public int aiResults() {
        return boundedInt(KEY_AI_RESULTS, DEFAULT_AI_RESULTS, 4, 24);
    }

    private int boundedInt(String key, int fallback, int min, int max) {
        return configurationRepository.findByKey(key).map(Configuration::getValue).map(value -> {
            try {
                int number = Integer.parseInt(value.trim());
                return number >= min && number <= max ? number : fallback;
            } catch (NumberFormatException e) {
                return fallback;
            }
        }).orElse(fallback);
    }

    public Map<String, Object> current() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("recommendSources", sources());
        map.put("recommendDismissDays", dismissDays());
        map.put("aiSuggestEnabled", aiEnabled());
        map.put("aiCandidateCount", aiCandidates());
        map.put("aiResultCount", aiResults());
        return map;
    }

    /** Saves the fields present. Returns the problem to show, or null when saved. */
    public String save(Map<String, Object> body) {
        if (body.containsKey("recommendDismissDays")) {
            Integer days = body.get("recommendDismissDays") instanceof Number n ? n.intValue() : null;
            if (days == null || days < 1 || days > 365) return "Số ngày không nhắc lại phải từ 1 đến 365";
            write(KEY_DISMISS_DAYS, String.valueOf(days));
        }
        if (body.containsKey("aiCandidateCount")) {
            Integer count = body.get("aiCandidateCount") instanceof Number n ? n.intValue() : null;
            if (count == null || count < 10 || count > 100) return "Số khóa gửi cho AI phải từ 10 đến 100";
        }
        if (body.containsKey("aiResultCount")) {
            Integer count = body.get("aiResultCount") instanceof Number n ? n.intValue() : null;
            if (count == null || count < 4 || count > 24) return "Số khóa AI trả về phải từ 4 đến 24";
        }
        if (body.containsKey("aiCandidateCount") && body.containsKey("aiResultCount")
                && ((Number) body.get("aiResultCount")).intValue() > ((Number) body.get("aiCandidateCount")).intValue()) {
            return "Số khóa AI trả về không được lớn hơn số khóa gửi đi";
        }
        if (body.containsKey("aiCandidateCount")) write(KEY_AI_CANDIDATES, String.valueOf(((Number) body.get("aiCandidateCount")).intValue()));
        if (body.containsKey("aiResultCount")) write(KEY_AI_RESULTS, String.valueOf(((Number) body.get("aiResultCount")).intValue()));
        if (body.get("aiSuggestEnabled") instanceof Boolean on) write(KEY_AI_ENABLED, on ? "1" : "0");
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
