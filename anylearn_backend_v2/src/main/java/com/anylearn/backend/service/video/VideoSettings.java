package com.anylearn.backend.service.video;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.service.quiz.QuizGameSettings;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Numbers of the video courses (plan 17), rows `video/*` of the configurations table. One FIELDS table drives reading,
 * saving and the back office form (button "Cài đặt chung" on the tab "Nội dung video" of a course).
 */
@Component
public class VideoSettings {

    private static final Map<String, QuizGameSettings.Field> FIELDS = new LinkedHashMap<>();

    private static void field(String key, String label, String group, int def, int min, int max) {
        FIELDS.put(key, new QuizGameSettings.Field(key, label, group, def, min, max));
    }

    static {
        field("complete_percent", "Bài được tính là xong khi xem tới (% thời lượng)", "Tiến độ", 90, 50, 100);
        field("min_watch_percent", "và thời gian xem thật ít nhất (% thời lượng, tua không tính)", "Tiến độ", 70, 0, 100);
        field("play_link_hours", "Link phát video có hạn (giờ)", "Tiến độ", 4, 1, 48);
        field("suggest_percent", "Gợi ý khóa tiếp theo khi học được (%)", "Gợi ý", 80, 10, 99);
        field("study_remind_enabled", "Nhắc theo lịch tự học (1 = bật, 0 = tắt)", "Nhắc học", 1, 0, 1);
        field("idle_remind_days", "Nhắc nhẹ khi bỏ dở khóa (ngày, 0 = tắt)", "Nhắc học", 7, 0, 90);
    }

    private final ConfigurationRepository configurationRepository;

    public VideoSettings(ConfigurationRepository configurationRepository) {
        this.configurationRepository = configurationRepository;
    }

    public int n(String name) {
        QuizGameSettings.Field f = FIELDS.get(name);
        try {
            int value = Integer.parseInt(read("video/" + name).orElse(String.valueOf(f.def())).trim());
            return Math.min(Math.max(value, f.min()), f.max());
        } catch (NumberFormatException e) {
            return f.def();
        }
    }

    public int completePercent() { return n("complete_percent"); }
    public int minWatchPercent() { return n("min_watch_percent"); }
    public int playLinkHours() { return n("play_link_hours"); }
    public int suggestPercent() { return n("suggest_percent"); }
    public boolean studyRemindEnabled() { return n("study_remind_enabled") == 1; }
    public int idleRemindDays() { return n("idle_remind_days"); }

    public Map<String, Object> asMap() {
        Map<String, Object> numbers = new LinkedHashMap<>();
        for (String name : FIELDS.keySet()) numbers.put(name, n(name));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("numbers", numbers);
        out.put("fields", fields());
        return out;
    }

    public List<QuizGameSettings.Field> fields() {
        return List.copyOf(FIELDS.values());
    }

    /** Why the body cannot be saved, or null when it can. */
    public String check(Map<String, Object> body) {
        if (body.get("numbers") instanceof Map<?, ?> numbers) {
            for (Map.Entry<?, ?> e : numbers.entrySet()) {
                QuizGameSettings.Field f = FIELDS.get(String.valueOf(e.getKey()));
                if (f == null) continue;
                if (!(e.getValue() instanceof Number v)) return "Giá trị không hợp lệ: " + f.label();
                if (v.intValue() < f.min() || v.intValue() > f.max()) return f.label() + " phải từ " + f.min() + " đến " + f.max();
            }
        }
        return null;
    }

    /** Saves what is sent; call {@link #check} first. */
    public void save(Map<String, Object> body) {
        if (body.get("numbers") instanceof Map<?, ?> numbers) {
            for (Map.Entry<?, ?> e : numbers.entrySet()) {
                if (FIELDS.containsKey(String.valueOf(e.getKey())) && e.getValue() instanceof Number v) {
                    write("video/" + e.getKey(), String.valueOf(v.intValue()));
                }
            }
        }
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
