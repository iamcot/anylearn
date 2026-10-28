package com.anylearn.backend.service.explore;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.service.chat.ChatRules;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** `explore/*` rows of the configurations table (back office page "Khám phá" > Cấu hình). */
@Component
public class ExploreSettings {

    private final ConfigurationRepository configurationRepository;

    public ExploreSettings(ConfigurationRepository configurationRepository) {
        this.configurationRepository = configurationRepository;
    }

    public boolean enabled() { return !"0".equals(read("explore/enabled").orElse("1").trim()); }

    public boolean commentsEnabled() { return !"0".equals(read("explore/comments_enabled").orElse("1").trim()); }

    public int commentsPerMinute() {
        try {
            int v = Integer.parseInt(read("explore/comments_per_minute").orElse("5").trim());
            return Math.max(0, Math.min(v, 60));
        } catch (NumberFormatException e) {
            return 5;
        }
    }

    public List<String> bannedWords() { return ChatRules.parseWords(read("explore/banned_words").orElse("")); }

    public Map<String, Object> asMap() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", enabled());
        out.put("commentsEnabled", commentsEnabled());
        out.put("commentsPerMinute", commentsPerMinute());
        out.put("bannedWords", read("explore/banned_words").orElse(""));
        return out;
    }

    public void save(Map<String, Object> body) {
        if (body.get("enabled") instanceof Boolean b) write("explore/enabled", b ? "1" : "0");
        if (body.get("commentsEnabled") instanceof Boolean b) write("explore/comments_enabled", b ? "1" : "0");
        if (body.get("commentsPerMinute") instanceof Number n) write("explore/comments_per_minute", String.valueOf(Math.max(0, Math.min(n.intValue(), 60))));
        if (body.get("bannedWords") instanceof String s) write("explore/banned_words", s);
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
