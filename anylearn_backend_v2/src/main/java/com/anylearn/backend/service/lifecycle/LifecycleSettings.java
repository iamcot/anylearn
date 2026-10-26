package com.anylearn.backend.service.lifecycle;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Optional;

/** Reads the `lifecycle/*` rows of the configurations table (edited in the back office, Cài đặt > Vận hành); each falls back to a default. */
@Component
public class LifecycleSettings {

    public static final String KEY_ENABLED = "lifecycle/enabled";
    public static final String KEY_PRE_START_DAYS = "lifecycle/pre_start_days";
    public static final String KEY_ABSENT_STREAK = "lifecycle/absent_streak";
    public static final String KEY_SURVEY_PERCENT = "lifecycle/survey_percent";
    public static final String KEY_SURVEY_LOW_SCORE = "lifecycle/survey_low_score";
    public static final String KEY_RENEW_SESSIONS_LEFT = "lifecycle/renew_sessions_left";
    public static final String KEY_RENEW_DAYS_BEFORE = "lifecycle/renew_days_before";
    public static final String KEY_FEE_DAYS = "lifecycle/fee_days";
    public static final String KEY_SEND_FROM_HOUR = "lifecycle/send_from_hour";
    public static final String KEY_SEND_TO_HOUR = "lifecycle/send_to_hour";
    public static final String KEY_RENEW_BONUS_POINTS = "lifecycle/early_renew_bonus_points";

    public static final List<Integer> DEFAULT_PRE_START_DAYS = List.of(3, 1);
    public static final List<Integer> DEFAULT_FEE_DAYS = List.of(7, 1);
    public static final int DEFAULT_ABSENT_STREAK = 2;
    public static final int DEFAULT_SURVEY_PERCENT = 50;
    public static final int DEFAULT_SURVEY_LOW_SCORE = 2;
    public static final int DEFAULT_RENEW_SESSIONS_LEFT = 3;
    public static final int DEFAULT_RENEW_DAYS_BEFORE = 14;
    public static final int DEFAULT_SEND_FROM_HOUR = 8;
    public static final int DEFAULT_SEND_TO_HOUR = 21;

    private final ConfigurationRepository configurationRepository;

    public LifecycleSettings(ConfigurationRepository configurationRepository) {
        this.configurationRepository = configurationRepository;
    }

    public boolean enabled() {
        return !read(KEY_ENABLED).map(String::trim).filter("0"::equals).isPresent();
    }

    public List<Integer> preStartDays() {
        return LifecycleRules.parseDays(read(KEY_PRE_START_DAYS).orElse(null), DEFAULT_PRE_START_DAYS);
    }

    public int absentStreak() {
        return LifecycleRules.intOr(read(KEY_ABSENT_STREAK).orElse(null), DEFAULT_ABSENT_STREAK, 1, 20);
    }

    public int surveyPercent() {
        return LifecycleRules.intOr(read(KEY_SURVEY_PERCENT).orElse(null), DEFAULT_SURVEY_PERCENT, 10, 90);
    }

    public int surveyLowScore() {
        return LifecycleRules.intOr(read(KEY_SURVEY_LOW_SCORE).orElse(null), DEFAULT_SURVEY_LOW_SCORE, 1, 4);
    }

    public int renewSessionsLeft() {
        return LifecycleRules.intOr(read(KEY_RENEW_SESSIONS_LEFT).orElse(null), DEFAULT_RENEW_SESSIONS_LEFT, 1, 30);
    }

    public int renewDaysBefore() {
        return LifecycleRules.intOr(read(KEY_RENEW_DAYS_BEFORE).orElse(null), DEFAULT_RENEW_DAYS_BEFORE, 1, 90);
    }

    public List<Integer> feeDays() {
        return LifecycleRules.parseDays(read(KEY_FEE_DAYS).orElse(null), DEFAULT_FEE_DAYS);
    }

    public int sendFromHour() {
        return LifecycleRules.intOr(read(KEY_SEND_FROM_HOUR).orElse(null), DEFAULT_SEND_FROM_HOUR, 0, 23);
    }

    public int sendToHour() {
        int to = LifecycleRules.intOr(read(KEY_SEND_TO_HOUR).orElse(null), DEFAULT_SEND_TO_HOUR, 1, 24);
        return to > sendFromHour() ? to : DEFAULT_SEND_TO_HOUR;
    }

    /** anyPoint given to a buyer who renews before the course ends; 0 = no incentive. */
    public int earlyRenewBonusPoints() {
        return LifecycleRules.intOr(read(KEY_RENEW_BONUS_POINTS).orElse(null), 0, 0, 100000);
    }

    private Optional<String> read(String key) {
        return configurationRepository.findByKey(key).map(row -> row.getValue()).filter(value -> value != null && !value.isBlank());
    }

    /** The values for the back office page (names are the same as in {@link #save}). */
    public Map<String, Object> current() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("lifecycleEnabled", enabled());
        map.put("preStartDays", preStartDays());
        map.put("absentStreak", absentStreak());
        map.put("surveyPercent", surveyPercent());
        map.put("surveyLowScore", surveyLowScore());
        map.put("renewSessionsLeft", renewSessionsLeft());
        map.put("renewDaysBefore", renewDaysBefore());
        map.put("feeDays", feeDays());
        map.put("sendFromHour", sendFromHour());
        map.put("sendToHour", sendToHour());
        map.put("earlyRenewBonusPoints", earlyRenewBonusPoints());
        return map;
    }

    /** Saves the fields present in the body. Returns the problem to show, or null when everything was saved. */
    public String save(Map<String, Object> body) {
        Map<String, String> rows = new LinkedHashMap<>();
        String[][] numbers = {
                {"absentStreak", KEY_ABSENT_STREAK, "1", "20", "Số buổi vắng liên tiếp"},
                {"surveyPercent", KEY_SURVEY_PERCENT, "10", "90", "Mốc khảo sát giữa khóa (%)"},
                {"surveyLowScore", KEY_SURVEY_LOW_SCORE, "1", "4", "Điểm bị coi là thấp"},
                {"renewSessionsLeft", KEY_RENEW_SESSIONS_LEFT, "1", "30", "Số buổi còn lại để nhắc gia hạn"},
                {"renewDaysBefore", KEY_RENEW_DAYS_BEFORE, "1", "90", "Số ngày trước khi hết khóa để nhắc gia hạn"},
                {"sendFromHour", KEY_SEND_FROM_HOUR, "0", "23", "Giờ bắt đầu gửi"},
                {"sendToHour", KEY_SEND_TO_HOUR, "1", "24", "Giờ ngừng gửi"},
                {"earlyRenewBonusPoints", KEY_RENEW_BONUS_POINTS, "0", "100000", "anyPoint tặng khi gia hạn sớm"}};
        for (String[] def : numbers) {
            if (!body.containsKey(def[0])) continue;
            Integer value = body.get(def[0]) instanceof Number n ? n.intValue() : null;
            String problem = LifecycleRules.rangeProblem(value, Integer.parseInt(def[2]), Integer.parseInt(def[3]), def[4]);
            if (problem != null) return problem;
            rows.put(def[1], String.valueOf(value));
        }
        String[][] lists = {
                {"preStartDays", KEY_PRE_START_DAYS, "nhắc trước khai giảng"},
                {"feeDays", KEY_FEE_DAYS, "nhắc học phí"}};
        for (String[] def : lists) {
            if (!body.containsKey(def[0])) continue;
            List<Integer> days = body.get(def[0]) instanceof List<?> list
                    ? list.stream().map(item -> item instanceof Number n ? n.intValue() : (Integer) null).collect(Collectors.toList()) : null;
            String problem = LifecycleRules.daysProblem(days, def[2]);
            if (problem != null) return problem;
            rows.put(def[1], days.stream().map(String::valueOf).collect(Collectors.joining(",")));
        }
        int from = rows.containsKey(KEY_SEND_FROM_HOUR) ? Integer.parseInt(rows.get(KEY_SEND_FROM_HOUR)) : sendFromHour();
        int to = rows.containsKey(KEY_SEND_TO_HOUR) ? Integer.parseInt(rows.get(KEY_SEND_TO_HOUR)) : sendToHour();
        if (to <= from) return "Giờ ngừng gửi phải sau giờ bắt đầu gửi";
        if (body.get("lifecycleEnabled") instanceof Boolean enabled) rows.put(KEY_ENABLED, enabled ? "1" : "0");
        rows.forEach(this::write);
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
