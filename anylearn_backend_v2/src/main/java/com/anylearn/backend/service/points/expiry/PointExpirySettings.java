package com.anylearn.backend.service.points.expiry;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/** Reads the `points/expiry_*` rows of the configurations table (Cài đặt > Vận hành); each falls back to a default. */
@Component
public class PointExpirySettings {

    public static final String KEY_ENABLED = "points/expiry_enabled";
    public static final String KEY_MONTHS = "points/expiry_months";
    public static final String KEY_START_DATE = "points/expiry_start_date";

    private final ConfigurationRepository configurationRepository;

    public PointExpirySettings(ConfigurationRepository configurationRepository) {
        this.configurationRepository = configurationRepository;
    }

    public boolean enabled() {
        return !read(KEY_ENABLED).map(String::trim).filter("0"::equals).isPresent();
    }

    public int months() {
        return PointExpiryRules.months(read(KEY_MONTHS).orElse(null));
    }

    public LocalDate startDate() {
        return PointExpiryRules.start(read(KEY_START_DATE).orElse(null));
    }

    public Map<String, Object> current() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("pointExpiryEnabled", enabled());
        map.put("pointExpiryMonths", months());
        map.put("pointExpiryStartDate", startDate().toString());
        return map;
    }

    /** Checks the fields present in the body; null when fine. */
    public String problem(Map<String, Object> body) {
        if (body.containsKey("pointExpiryMonths")) {
            Integer months = body.get("pointExpiryMonths") instanceof Number n ? n.intValue() : null;
            String problem = PointExpiryRules.monthsProblem(months);
            if (problem != null) return problem;
        }
        if (body.containsKey("pointExpiryStartDate")) {
            String problem = PointExpiryRules.startProblem(body.get("pointExpiryStartDate") instanceof String s ? s : null);
            if (problem != null) return problem;
        }
        return null;
    }

    /** Writes the fields present in the body (call after `problem` returned null). */
    public void save(Map<String, Object> body) {
        if (body.get("pointExpiryEnabled") instanceof Boolean on) write(KEY_ENABLED, on ? "1" : "0");
        if (body.get("pointExpiryMonths") instanceof Number n) write(KEY_MONTHS, String.valueOf(n.intValue()));
        if (body.get("pointExpiryStartDate") instanceof String s) write(KEY_START_DATE, LocalDate.parse(s.trim()).toString());
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
