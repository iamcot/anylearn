package com.anylearn.backend.service.mission;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Weekly mission numbers, rows `mission/{key}/target|reward|enabled` and `mission/bonus_needed` of the configurations table,
 * edited on the back office page "Điểm danh & quà". One table ({@link #FIELDS}) drives reading, saving and the form.
 */
@Component
public class MissionSettings {

    /** Name (the part after `mission/`), label, group, default, min, max. */
    public record Field(String key, String label, String group, int def, int min, int max) {}

    private static final Map<String, Field> FIELDS = new LinkedHashMap<>();

    private static void field(String key, String label, String group, int def, int min, int max) {
        FIELDS.put(key, new Field(key, label, group, def, min, max));
    }

    static {
        for (MissionRules.Def d : MissionRules.DEFS) {
            field(d.key() + "/target", "Mục tiêu (số lần hoặc số ngày)", d.label(), d.defTarget(), 1, 1000);
            field(d.key() + "/reward", "Thưởng (xu)", d.label(), d.defReward(), 0, 100000);
            field(d.key() + "/enabled", "Bật (1 = có, 0 = tắt)", d.label(), 1, 0, 1);
        }
        field("bonus_needed", "Số nhiệm vụ cần xong để nhận sticker thưởng", "Sticker thưởng của tuần", MissionRules.DEFAULT_BONUS_NEEDED, 1, MissionRules.DEFS.size());
    }

    private final ConfigurationRepository configurationRepository;

    public MissionSettings(ConfigurationRepository configurationRepository) {
        this.configurationRepository = configurationRepository;
    }

    private int n(String name) {
        Field f = FIELDS.get(name);
        try {
            int value = Integer.parseInt(read("mission/" + name).orElse(String.valueOf(f.def())).trim());
            return Math.min(Math.max(value, f.min()), f.max());
        } catch (NumberFormatException e) {
            return f.def();
        }
    }

    public int target(String key) { return n(key + "/target"); }

    public int reward(String key) { return n(key + "/reward"); }

    public boolean enabled(String key) { return n(key + "/enabled") == 1; }

    public int bonusNeeded() { return n("bonus_needed"); }

    public Map<String, Object> asMap() {
        Map<String, Object> out = new LinkedHashMap<>();
        Map<String, Object> numbers = new LinkedHashMap<>();
        for (String name : FIELDS.keySet()) numbers.put(name, n(name));
        out.put("numbers", numbers);
        out.put("fields", List.copyOf(FIELDS.values()));
        return out;
    }

    /** Saves what is sent; a value outside its range is an error so the form can say which one. Null when saved. */
    public String save(Map<String, Object> body) {
        if (!(body.get("numbers") instanceof Map<?, ?> numbers)) return null;
        for (Map.Entry<?, ?> e : numbers.entrySet()) {
            Field f = FIELDS.get(String.valueOf(e.getKey()));
            if (f == null) continue;
            if (!(e.getValue() instanceof Number v)) return "Giá trị không hợp lệ: " + f.group() + " - " + f.label();
            if (v.intValue() < f.min() || v.intValue() > f.max()) return f.group() + " - " + f.label() + " phải từ " + f.min() + " đến " + f.max();
        }
        for (Map.Entry<?, ?> e : numbers.entrySet()) {
            if (FIELDS.containsKey(String.valueOf(e.getKey())) && e.getValue() instanceof Number v) {
                write("mission/" + e.getKey(), String.valueOf(v.intValue()));
            }
        }
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
