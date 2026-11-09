package com.anylearn.backend.service.farm;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Numbers of Nông trại anyLEARN, rows `farm/{key}` of the configurations table. One table ({@link #FIELDS}) drives reading,
 * saving and the back office form (same pattern as the weekly missions).
 */
@Component
public class FarmSettings {

    public record Field(String key, String label, String group, int def, int min, int max) {}

    private static final Map<String, Field> FIELDS = new LinkedHashMap<>();

    private static void f(String key, String label, String group, int def, int min, int max) {
        FIELDS.put(key, new Field(key, label, group, def, min, max));
    }

    static {
        f("enabled", "Bật Nông trại (1 = có, 0 = tắt)", "Chung", 1, 0, 1);
        f("thirsty_speed", "Cây khát lớn bằng bao nhiêu % tốc độ", "Chăm cây", 50, 0, 100);
        f("thirst_grace_minutes", "Phút được trễ khi tưới trước khi mất 1 quả", "Chăm cây", 60, 0, 1440);
        f("min_yield", "Sản lượng tối thiểu của một vụ", "Chăm cây", 2, 0, 20);
        f("ripe_hours_min", "Giờ giữ chín tối thiểu trước khi héo", "Chăm cây", 4, 0, 168);
        f("wilt_step_hours", "Cứ bao nhiêu giờ héo mất 1 quả", "Chăm cây", 6, 1, 168);
        f("fertilizer_price", "Giá 1 phân bón (Leo Xu)", "Chăm cây", 3, 0, 1000);
        f("starter_fertilizer", "Phân bón tặng lúc bắt đầu", "Chăm cây", 2, 0, 100);
        f("starter_seeds", "Hạt rau mầm tặng lúc bắt đầu", "Chăm cây", 6, 0, 100);
        f("starter_seeds_carrot", "Hạt cà rốt tặng lúc bắt đầu", "Chăm cây", 4, 0, 100);
        f("price_jitter", "Giá chợ dao động mỗi ngày (± %)", "Chợ", 20, 0, 50);
        f("same_crop_full_units", "Số quả cùng loại bán đủ giá mỗi ngày", "Chợ", 12, 1, 1000);
        f("same_crop_step1", "Giá % cho lượt bán thứ hai", "Chợ", 70, 0, 100);
        f("same_crop_step2", "Giá % cho các quả sau đó", "Chợ", 40, 0, 100);
        f("profit_cap_base", "Trần lãi ròng mỗi ngày: mức nền (Leo Xu)", "Trần lãi (chống lạm phát)", 8, 0, 1000);
        f("profit_cap_per_2_levels", "Cộng thêm mỗi 2 cấp vườn", "Trần lãi (chống lạm phát)", 1, 0, 100);
        f("profit_cap_max", "Trần lãi ròng mỗi ngày: tối đa", "Trần lãi (chống lạm phát)", 18, 0, 1000);
        f("weekly_profit_cap", "Trần lãi ròng mỗi tuần (Leo Xu)", "Trần lãi (chống lạm phát)", 70, 0, 10000);
        f("xp_base", "XP cơ bản để lên cấp", "Cấp vườn", 40, 1, 10000);
        f("xp_exp_tenths", "Độ dốc XP (x10, 14 = 1,4)", "Cấp vườn", 14, 5, 30);
        f("actions_per_minute", "Số thao tác tối đa mỗi phút", "Chống gian lận", 60, 5, 1000);
    }

    private final ConfigurationRepository configurationRepository;

    public FarmSettings(ConfigurationRepository configurationRepository) {
        this.configurationRepository = configurationRepository;
    }

    public int n(String name) {
        Field f = FIELDS.get(name);
        try {
            int value = Integer.parseInt(read("farm/" + name).orElse(String.valueOf(f.def())).trim());
            return Math.min(Math.max(value, f.min()), f.max());
        } catch (NumberFormatException e) {
            return f.def();
        }
    }

    public boolean enabled() { return n("enabled") == 1; }

    public FarmRules.Params params() {
        return new FarmRules.Params(n("thirsty_speed"), n("thirst_grace_minutes"), n("min_yield"), n("ripe_hours_min"),
                n("wilt_step_hours"), n("xp_base"), n("xp_exp_tenths"));
    }

    public Map<String, Object> asMap() {
        Map<String, Object> out = new LinkedHashMap<>();
        Map<String, Object> numbers = new LinkedHashMap<>();
        for (String name : FIELDS.keySet()) numbers.put(name, n(name));
        out.put("numbers", numbers);
        out.put("fields", List.copyOf(FIELDS.values()));
        return out;
    }

    /** Saves what is sent; a value outside its range is an error. Null when saved. */
    public String save(Map<String, Object> body) {
        if (!(body.get("numbers") instanceof Map<?, ?> numbers)) return null;
        for (Map.Entry<?, ?> e : numbers.entrySet()) {
            Field f = FIELDS.get(String.valueOf(e.getKey()));
            if (f == null) continue;
            if (!(e.getValue() instanceof Number v)) return "Giá trị không hợp lệ: " + f.group() + " - " + f.label();
            if (v.intValue() < f.min() || v.intValue() > f.max()) return f.group() + " - " + f.label() + " phải từ " + f.min() + " đến " + f.max();
        }
        for (Map.Entry<?, ?> e : numbers.entrySet()) {
            if (FIELDS.containsKey(String.valueOf(e.getKey())) && e.getValue() instanceof Number v) write("farm/" + e.getKey(), String.valueOf(v.intValue()));
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
