package com.anylearn.backend.service.settings;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * A table of whole-number settings stored as rows `{prefix}/{key}` of `configurations`: one list of fields drives
 * reading (clamped to min..max, default when missing), saving (refused when out of range) and the admin form.
 * Used by the plan 21 settings (learner tier, Foundation, journey, milestones, guest quiz).
 */
public class NumberSettings {

    /** Key (after the prefix), label, group, default, min, max. */
    public record Field(String key, String label, String group, long def, long min, long max) {}

    private final String prefix;
    private final Map<String, Field> fields = new LinkedHashMap<>();
    private final ConfigurationRepository repo;

    public NumberSettings(String prefix, ConfigurationRepository repo) {
        this.prefix = prefix;
        this.repo = repo;
    }

    public NumberSettings field(String key, String label, String group, long def, long min, long max) {
        fields.put(key, new Field(key, label, group, def, min, max));
        return this;
    }

    public long get(String key) {
        Field f = fields.get(key);
        if (f == null) throw new IllegalArgumentException("Unknown setting " + prefix + "/" + key);
        try {
            long v = Long.parseLong(read(prefix + "/" + key).orElse(String.valueOf(f.def())).trim());
            return Math.min(Math.max(v, f.min()), f.max());
        } catch (NumberFormatException e) {
            return f.def();
        }
    }

    public int getInt(String key) { return (int) get(key); }

    public boolean on(String key) { return get(key) == 1; }

    public Map<String, Object> asMap() {
        Map<String, Object> numbers = new LinkedHashMap<>();
        for (String k : fields.keySet()) numbers.put(k, get(k));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("numbers", numbers);
        out.put("fields", List.copyOf(fields.values()));
        return out;
    }

    /** Saves `{numbers: {key: value}}`; returns an error text naming the field, or null when saved. */
    public String save(Map<String, Object> body) {
        if (!(body.get("numbers") instanceof Map<?, ?> numbers)) return "Thiếu dữ liệu";
        for (Map.Entry<?, ?> e : numbers.entrySet()) {
            Field f = fields.get(String.valueOf(e.getKey()));
            if (f == null) continue;
            if (!(e.getValue() instanceof Number v)) return "Giá trị không hợp lệ: " + f.group() + " - " + f.label();
            if (v.longValue() < f.min() || v.longValue() > f.max())
                return f.group() + " - " + f.label() + " phải từ " + f.min() + " đến " + f.max();
        }
        for (Map.Entry<?, ?> e : numbers.entrySet()) {
            if (fields.containsKey(String.valueOf(e.getKey())) && e.getValue() instanceof Number v)
                write(prefix + "/" + e.getKey(), String.valueOf(v.longValue()));
        }
        return null;
    }

    private Optional<String> read(String key) {
        return repo.findByKey(key).map(Configuration::getValue).filter(v -> v != null && !v.isBlank());
    }

    private void write(String key, String value) {
        Configuration row = repo.findByKey(key).orElseGet(() -> {
            Configuration created = new Configuration();
            created.setKey(key);
            created.setType("text");
            created.setCreatedAt(LocalDateTime.now());
            return created;
        });
        row.setValue(value);
        row.setUpdatedAt(LocalDateTime.now());
        repo.save(row);
    }
}
