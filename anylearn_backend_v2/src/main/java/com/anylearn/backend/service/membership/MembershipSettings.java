package com.anylearn.backend.service.membership;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/** `tiers/*` and `family/*` rows of the configurations table (back office page "Hạng & ưu đãi gia đình"). */
@Component
public class MembershipSettings {

    private static final String[][] NUMBERS = {
            {"silverMin", "tiers/silver_min", "3000000"}, {"goldMin", "tiers/gold_min", "10000000"}, {"diamondMin", "tiers/diamond_min", "30000000"},
            {"multSilver", "tiers/mult_silver", "1.2"}, {"multGold", "tiers/mult_gold", "1.5"}, {"multDiamond", "tiers/mult_diamond", "2.0"},
            {"familyPercent", "family/percent", "5"}, {"familyWindowDays", "family/window_days", "30"}};

    private final ConfigurationRepository configurations;

    public MembershipSettings(ConfigurationRepository configurations) {
        this.configurations = configurations;
    }

    public boolean tiersEnabled() { return flag("tiers/enabled"); }

    public boolean familyEnabled() { return flag("family/enabled"); }

    public int familyPercent() { return (int) clamp(number("family/percent", 5), 0, 50); }

    public int familyWindowDays() { return (int) clamp(number("family/window_days", 30), 1, 365); }

    public MemberTierRules.Thresholds thresholds() {
        MemberTierRules.Thresholds t = new MemberTierRules.Thresholds((long) number("tiers/silver_min", 3_000_000),
                (long) number("tiers/gold_min", 10_000_000), (long) number("tiers/diamond_min", 30_000_000));
        return MemberTierRules.thresholdProblem(t.silver(), t.gold(), t.diamond()) == null ? t : new MemberTierRules.Thresholds(3_000_000, 10_000_000, 30_000_000);
    }

    public MemberTierRules.Multipliers multipliers() {
        return new MemberTierRules.Multipliers(clamp(number("tiers/mult_silver", 1.2), 1, 5),
                clamp(number("tiers/mult_gold", 1.5), 1, 5), clamp(number("tiers/mult_diamond", 2.0), 1, 5));
    }

    public Map<String, Object> current() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("tiersEnabled", tiersEnabled());
        map.put("familyEnabled", familyEnabled());
        for (String[] def : NUMBERS) map.put(def[0], number(def[1], Double.parseDouble(def[2])));
        return map;
    }

    /** Saves the fields present in the body. Returns the problem to show, or null when everything was saved. */
    public String save(Map<String, Object> body) {
        Map<String, String> rows = new LinkedHashMap<>();
        for (String[] def : NUMBERS) {
            if (!body.containsKey(def[0])) continue;
            Double value = body.get(def[0]) instanceof Number n ? n.doubleValue() : null;
            if (value == null || value < 0) return "Giá trị không hợp lệ: " + def[0];
            rows.put(def[1], stripZero(value));
        }
        double silver = rows.containsKey("tiers/silver_min") ? Double.parseDouble(rows.get("tiers/silver_min")) : number("tiers/silver_min", 3_000_000);
        double gold = rows.containsKey("tiers/gold_min") ? Double.parseDouble(rows.get("tiers/gold_min")) : number("tiers/gold_min", 10_000_000);
        double diamond = rows.containsKey("tiers/diamond_min") ? Double.parseDouble(rows.get("tiers/diamond_min")) : number("tiers/diamond_min", 30_000_000);
        String problem = MemberTierRules.thresholdProblem((long) silver, (long) gold, (long) diamond);
        if (problem != null) return problem;
        for (String key : new String[]{"tiers/mult_silver", "tiers/mult_gold", "tiers/mult_diamond"}) {
            if (rows.containsKey(key) && (Double.parseDouble(rows.get(key)) < 1 || Double.parseDouble(rows.get(key)) > 5)) return "Hệ số điểm từ 1 đến 5 (1 = không thưởng thêm)";
        }
        if (rows.containsKey("family/percent") && Double.parseDouble(rows.get("family/percent")) > 50) return "Giảm giá gia đình tối đa 50%";
        if (rows.containsKey("family/window_days") && (Double.parseDouble(rows.get("family/window_days")) < 1 || Double.parseDouble(rows.get("family/window_days")) > 365)) return "Số ngày từ 1 đến 365";
        if (body.get("tiersEnabled") instanceof Boolean b) rows.put("tiers/enabled", b ? "1" : "0");
        if (body.get("familyEnabled") instanceof Boolean b) rows.put("family/enabled", b ? "1" : "0");
        rows.forEach(this::write);
        return null;
    }

    private static String stripZero(double v) {
        return v == Math.floor(v) ? String.valueOf((long) v) : String.valueOf(v);
    }

    private boolean flag(String key) { return !"0".equals(read(key).orElse("1").trim()); }

    private double number(String key, double fallback) {
        try { return read(key).map(s -> Double.parseDouble(s.trim())).orElse(fallback); } catch (NumberFormatException e) { return fallback; }
    }

    private static double clamp(double v, double min, double max) { return Math.max(min, Math.min(max, v)); }

    private Optional<String> read(String key) {
        return configurations.findByKey(key).map(Configuration::getValue).filter(v -> v != null && !v.isBlank());
    }

    private void write(String key, String value) {
        Configuration row = configurations.findByKey(key).orElseGet(() -> {
            Configuration created = new Configuration();
            created.setKey(key);
            created.setType("text");
            created.setCreatedAt(LocalDateTime.now());
            return created;
        });
        row.setValue(value);
        row.setUpdatedAt(LocalDateTime.now());
        configurations.save(row);
    }
}
