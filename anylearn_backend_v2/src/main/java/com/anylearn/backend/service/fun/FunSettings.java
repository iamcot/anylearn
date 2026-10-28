package com.anylearn.backend.service.fun;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/** `fun/*` rows of the configurations table, edited on the back office page "Điểm danh & quà". */
@Component
public class FunSettings {

    public static final String KEY_ENABLED = "fun/enabled";
    public static final String KEY_CHECKIN_POINTS = "fun/checkin_points";
    public static final String KEY_CHECKIN_DAILY_CAP = "fun/checkin_daily_cap";
    public static final String KEY_COIN_NAME = "fun/coin_name";
    public static final String DEFAULT_COIN_NAME = "Leo Xu";

    private final ConfigurationRepository configurationRepository;

    public FunSettings(ConfigurationRepository configurationRepository) {
        this.configurationRepository = configurationRepository;
    }

    public boolean enabled() {
        return !read(KEY_ENABLED).map(String::trim).filter("0"::equals).isPresent();
    }

    public List<Integer> checkinPoints() {
        return FunRules.parseDayPoints(read(KEY_CHECKIN_POINTS).orElse(null));
    }

    /** Most anyPoint the check-in gives out in one day, 0 = no limit. */
    public long checkinDailyCap() {
        try {
            return Math.max(Long.parseLong(read(KEY_CHECKIN_DAILY_CAP).orElse("0").trim()), 0);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    /** What the game currency is called on every screen; set in the back office. */
    public String coinName() {
        return read(KEY_COIN_NAME).map(String::trim).filter(v -> !v.isEmpty()).orElse(DEFAULT_COIN_NAME);
    }

    /** Null when saved, else why the name is refused. */
    public String saveCoinName(String name) {
        String clean = name == null ? "" : name.trim();
        if (clean.isEmpty() || clean.length() > 20) return "Tên tiền từ 1 đến 20 ký tự";
        write(KEY_COIN_NAME, clean);
        return null;
    }

    public void save(boolean enabled, List<Integer> dayPoints, long dailyCap) {
        write(KEY_ENABLED, enabled ? "1" : "0");
        write(KEY_CHECKIN_POINTS, dayPoints.stream().map(String::valueOf).collect(Collectors.joining(",")));
        write(KEY_CHECKIN_DAILY_CAP, String.valueOf(Math.max(dailyCap, 0)));
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
