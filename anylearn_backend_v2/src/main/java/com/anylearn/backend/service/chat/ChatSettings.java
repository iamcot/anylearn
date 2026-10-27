package com.anylearn.backend.service.chat;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** The `chat/*` rows of the configurations table (back office page "Chat lớp"); each falls back to a default. */
@Component
public class ChatSettings {

    public static final String KEY_ENABLED = "chat/enabled";
    public static final String KEY_PARTNER_MODERATOR = "chat/partner_moderator";
    public static final String KEY_RATE = "chat/rate_per_minute";
    public static final String KEY_RETENTION_DAYS = "chat/retention_days";
    public static final String KEY_BANNED_WORDS = "chat/banned_words";
    public static final String KEY_RULES = "chat/rules_text";

    /** Wording the owner asked for; editable in the back office. */
    public static final String DEFAULT_RULES = String.join("\n",
            "Nhóm lớp là nơi phụ huynh, giáo viên và anyLEARN cùng trao đổi về việc học, để xây dựng môi trường học tập lành mạnh, văn minh và vui vẻ.",
            "1. Chỉ trao đổi các chủ đề liên quan đến việc học của lớp.",
            "2. Tôn trọng lẫn nhau, không đả kích, xúc phạm hay công kích cá nhân.",
            "3. Không bàn về tôn giáo, chính trị.",
            "4. Không quảng cáo, chèo kéo sang trung tâm hay khóa học khác; không chia sẻ số điện thoại, địa chỉ nhà hay hình ảnh của trẻ.",
            "5. Tin nhắn vi phạm có thể bị ẩn và tài khoản có thể bị khóa chat. Bạn có thể báo cáo tin không phù hợp, anyLEARN sẽ xử lý.");

    private final ConfigurationRepository configurations;

    public ChatSettings(ConfigurationRepository configurations) {
        this.configurations = configurations;
    }

    public boolean enabled() { return !"0".equals(read(KEY_ENABLED).orElse("1").trim()); }

    /** The partner of a course is the moderator of its class groups (teachers are added by hand in the back office). */
    public boolean partnerModerator() { return !"0".equals(read(KEY_PARTNER_MODERATOR).orElse("1").trim()); }

    public int ratePerMinute() { return intOr(read(KEY_RATE).orElse(null), 20, 0, 600); }

    public int retentionDays() { return intOr(read(KEY_RETENTION_DAYS).orElse(null), 30, 0, 365); }

    public List<String> bannedWords() { return ChatRules.parseWords(read(KEY_BANNED_WORDS).orElse("")); }

    public String rulesText() { return read(KEY_RULES).orElse(DEFAULT_RULES); }

    public Map<String, Object> current() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("enabled", enabled());
        map.put("partnerModerator", partnerModerator());
        map.put("ratePerMinute", ratePerMinute());
        map.put("retentionDays", retentionDays());
        map.put("bannedWords", read(KEY_BANNED_WORDS).orElse(""));
        map.put("rulesText", rulesText());
        return map;
    }

    /** Saves the fields present in the body. Returns the problem to show, or null when everything was saved. */
    public String save(Map<String, Object> body) {
        if (body.containsKey("ratePerMinute")) {
            Integer rate = asInt(body.get("ratePerMinute"));
            if (rate == null || rate < 0 || rate > 600) return "Số tin tối đa mỗi phút từ 0 đến 600 (0 = không giới hạn)";
            write(KEY_RATE, String.valueOf(rate));
        }
        if (body.containsKey("retentionDays")) {
            Integer days = asInt(body.get("retentionDays"));
            if (days == null || days < 0 || days > 365) return "Số ngày còn đọc được sau khóa học từ 0 đến 365";
            write(KEY_RETENTION_DAYS, String.valueOf(days));
        }
        if (body.containsKey("enabled")) write(KEY_ENABLED, Boolean.TRUE.equals(body.get("enabled")) ? "1" : "0");
        if (body.containsKey("partnerModerator")) write(KEY_PARTNER_MODERATOR, Boolean.TRUE.equals(body.get("partnerModerator")) ? "1" : "0");
        if (body.containsKey("bannedWords")) write(KEY_BANNED_WORDS, String.valueOf(body.get("bannedWords")));
        if (body.containsKey("rulesText")) {
            String text = String.valueOf(body.get("rulesText")).trim();
            if (text.length() > 4000) return "Nội quy tối đa 4000 ký tự";
            write(KEY_RULES, text);
        }
        return null;
    }

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

    private static Integer asInt(Object value) {
        if (value instanceof Number n) return n.intValue();
        try { return value == null ? null : Integer.parseInt(value.toString().trim()); } catch (NumberFormatException e) { return null; }
    }

    private static int intOr(String raw, int fallback, int min, int max) {
        Integer parsed = asInt(raw);
        return parsed == null || parsed < min || parsed > max ? fallback : parsed;
    }
}
