package com.anylearn.backend.service.sticker;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/** `sticker/*` rows of the configurations table, edited on the back office page "Sticker" > Cấu hình. */
@Component
public class StickerSettings {

    /** key → {default, min, max}; the same table drives reading, saving and the admin form. */
    private static final Map<String, int[]> NUMBERS = new LinkedHashMap<>();
    static {
        NUMBERS.put("checkin_chance", new int[]{15, 0, 100});      // % chance of a sticker on an ordinary check-in day
        NUMBERS.put("welcome_rare_chance", new int[]{10, 0, 100}); // % chance that the 2nd part of the welcome pack has a rare
        NUMBERS.put("welcome_lock_days", new int[]{7, 0, 60});
        NUMBERS.put("trade_window_days", new int[]{30, 1, 365});   // one trade per pair in this many days
        NUMBERS.put("trade_week_limit", new int[]{3, 1, 50});
        NUMBERS.put("trade_month_partners", new int[]{10, 1, 100});
        NUMBERS.put("offer_hours", new int[]{72, 1, 720});
        NUMBERS.put("eligible_age_days", new int[]{3, 0, 60});
        NUMBERS.put("eligible_checkins", new int[]{3, 0, 60});
        NUMBERS.put("hold_score", new int[]{50, 1, 100});          // risk score from which rewards wait for approval
        NUMBERS.put("invite_month_cap", new int[]{10, 1, 200});
        NUMBERS.put("market_max_listings", new int[]{3, 1, 10});   // open market listings per person
        NUMBERS.put("market_listing_days", new int[]{7, 1, 60});   // a listing expires after this many days
        NUMBERS.put("set_reward_points", new int[]{200, 0, 5000});
        NUMBERS.put("invite_coins", new int[]{50, 0, 5000});        // Leo Xu the inviter gets with the sticker, same moment and monthly cap
    }

    private final ConfigurationRepository configurationRepository;

    public StickerSettings(ConfigurationRepository configurationRepository) {
        this.configurationRepository = configurationRepository;
    }

    public boolean enabled() {
        return !"0".equals(read("sticker/enabled").map(String::trim).orElse("1"));
    }

    /** The day 7 gift always has a sticker while this is on. */
    public boolean day7Sticker() {
        return !"0".equals(read("sticker/day7_sticker").map(String::trim).orElse("1"));
    }

    public int number(String name) {
        int[] spec = NUMBERS.get(name);
        try {
            int value = Integer.parseInt(read("sticker/" + name).orElse(String.valueOf(spec[0])).trim());
            return Math.min(Math.max(value, spec[1]), spec[2]);
        } catch (NumberFormatException e) {
            return spec[0];
        }
    }

    public Map<String, Object> asMap() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", enabled());
        out.put("day7Sticker", day7Sticker());
        for (String name : NUMBERS.keySet()) out.put(name, number(name));
        return out;
    }

    public Map<String, int[]> numberSpecs() {
        return NUMBERS;
    }

    /** Saves what is sent; a value outside its range is an error so the form can say which one. */
    public String save(Map<String, Object> body) {
        for (Map.Entry<String, int[]> e : NUMBERS.entrySet()) {
            Object v = body.get(e.getKey());
            if (v == null) continue;
            if (!(v instanceof Number n)) return "Giá trị không hợp lệ: " + e.getKey();
            int[] spec = e.getValue();
            if (n.intValue() < spec[1] || n.intValue() > spec[2]) return e.getKey() + " phải từ " + spec[1] + " đến " + spec[2];
        }
        if (body.get("enabled") instanceof Boolean b) write("sticker/enabled", b ? "1" : "0");
        if (body.get("day7Sticker") instanceof Boolean b) write("sticker/day7_sticker", b ? "1" : "0");
        for (String name : NUMBERS.keySet()) {
            if (body.get(name) instanceof Number n) write("sticker/" + name, String.valueOf(n.intValue()));
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
