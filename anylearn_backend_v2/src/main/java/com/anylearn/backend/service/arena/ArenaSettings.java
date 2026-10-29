package com.anylearn.backend.service.arena;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Settings of Đấu trường Leo, rows `arena/*` of the configurations table (plan 18). One table of fields drives reading,
 * saving and the back office form; every field has a default, so the game works without any row.
 */
@Component
public class ArenaSettings {

    public static final String BOOL = "bool";
    public static final String INT = "int";
    public static final String TEXT = "text";
    public static final String TIME = "time";
    public static final String CSV = "csv";

    /** {@code min}/{@code max} apply to an int, and to each number of a csv of numbers ({@code max} 0 = free text csv). */
    public record Field(String key, String label, String group, String type, String def, int min, int max) {}

    private static final Map<String, Field> FIELDS = new LinkedHashMap<>();

    private static void f(String key, String label, String group, String type, String def, int min, int max) {
        FIELDS.put(key, new Field(key, label, group, type, def, min, max));
    }

    static {
        String g1 = "Bật tắt & lịch";
        f("feature_enabled", "Bật chức năng Đấu trường Leo (cả tự động và riêng)", g1, BOOL, "1", 0, 1);
        f("enabled", "Bật đấu trường tự động (tắt thì đấu trường riêng vẫn chạy)", g1, BOOL, "1", 0, 1);
        f("days", "Các ngày chạy (1 = thứ Hai … 7 = Chủ nhật)", g1, CSV, "1,2,3,4,5,6,7", 1, 7);
        f("start_time", "Giờ bắt đầu câu 1 (HH:mm)", g1, TIME, "20:00", 0, 0);
        f("open_minutes", "Mở phòng trước giờ bắt đầu (phút)", g1, INT, "10", 1, 60);
        f("presence_seconds", "Coi là đang trong phòng nếu có tín hiệu trong (giây)", g1, INT, "30", 10, 300);
        String g2 = "Nhịp trận";
        f("question_count", "Số câu hỏi", g2, INT, "20", 5, 50);
        f("countdown_seconds", "Đếm ngược trước mỗi câu (giây)", g2, INT, "10", 3, 30);
        f("answer_seconds", "Thời gian trả lời một câu (giây)", g2, INT, "15", 5, 60);
        f("reveal_seconds", "Thời gian xem đáp án (giây)", g2, INT, "5", 2, 20);
        f("gap_seconds", "Khoảng cách giữa hai câu (giây)", g2, INT, "60", 30, 600);
        String g3 = "Câu hỏi";
        f("topics", "Chủ đề dùng (mã chủ đề, cách nhau bằng dấu phẩy; để trống = mọi chủ đề đang bật)", g3, CSV, "", 0, 0);
        f("levels", "Cấp độ dùng (1 rất dễ … 5 rất khó)", g3, CSV, "1,2,3,4,5", 1, 5);
        f("no_repeat_days", "Không dùng lại câu đã ra ở Đấu trường trong (ngày)", g3, INT, "90", 0, 730);
        String g4 = "Thông báo";
        f("notify_minutes", "Gửi nhắc trước giờ bắt đầu (phút)", g4, INT, "10", 1, 120);
        f("notify_app", "Nhắc qua chuông + thông báo đẩy", g4, BOOL, "1", 0, 1);
        f("notify_email", "Nhắc qua email", g4, BOOL, "0", 0, 1);
        f("notify_zns", "Nhắc qua ZNS (Zalo)", g4, BOOL, "0", 0, 1);
        f("zns_template_id", "Mã mẫu ZNS (để trống = không gửi ZNS)", g4, TEXT, "", 0, 0);
        f("notify_title", "Tiêu đề nhắc ({time} = giờ bắt đầu)", g4, TEXT, "Đấu trường Leo sắp bắt đầu!", 0, 0);
        f("notify_body", "Nội dung nhắc ({time} = giờ bắt đầu)", g4, TEXT, "{time} hôm nay, vào phòng ngay kẻo lỡ câu 1 nhé.", 0, 0);
        f("result_notify", "Báo kết quả cho người đã chơi", g4, BOOL, "1", 0, 1);
        String g5 = "Quà";
        f("reward_coins", "Leo Xu top 1, 2, 3 (0 = không thưởng hạng đó)", g5, CSV, "300,200,100", 0, 100000);
        f("reward_sticker", "Top 3 nhận thêm sticker ngẫu nhiên", g5, BOOL, "1", 0, 1);
        f("reward_min_score", "Điểm tối thiểu để nhận quà top 3", g5, INT, "3", 0, 50);
        f("reward_participation", "Leo Xu thưởng tham gia (ngoài top 3, đã trả lời ít nhất 1 câu; 0 = tắt)", g5, INT, "20", 0, 10000);
        f("reward_achievement", "Top 3 nhận banner thành tích", g5, BOOL, "1", 0, 1);
        String g6 = "Chống gian lận";
        f("flag_fast_ms", "Gắn cờ nếu trả lời đúng nhanh hơn (ms, 0 = tắt)", g6, INT, "1000", 0, 10000);
        f("flag_away", "Gắn cờ nếu rời trang khi đang trả lời", g6, BOOL, "1", 0, 1);
        f("flagged_reward", "Vẫn trao quà top 3 cho người bị gắn cờ", g6, BOOL, "0", 0, 1);
    }

    private final ConfigurationRepository configurationRepository;

    public ArenaSettings(ConfigurationRepository configurationRepository) {
        this.configurationRepository = configurationRepository;
    }

    public String raw(String key) {
        Field f = FIELDS.get(key);
        String stored = configurationRepository.findByKey("arena/" + key).map(Configuration::getValue).orElse(null);
        if (stored == null) return f.def();
        // an empty value is a real choice only for text and csv fields (an empty topic list means every topic)
        if (stored.isBlank() && !(TEXT.equals(f.type()) || CSV.equals(f.type()))) return f.def();
        return stored;
    }

    public int num(String key) {
        Field f = FIELDS.get(key);
        try {
            return Math.min(Math.max(Integer.parseInt(raw(key).trim()), f.min()), f.max());
        } catch (NumberFormatException e) {
            return Integer.parseInt(f.def());
        }
    }

    public boolean flag(String key) {
        return "1".equals(raw(key).trim());
    }

    /** The automatic daily arena (its own switch, inside the feature switch). */
    public boolean enabled() { return featureEnabled() && flag("enabled"); }

    /** The whole feature: the automatic and the custom arena. */
    public boolean featureEnabled() { return flag("feature_enabled"); }

    public Set<DayOfWeek> days() {
        Set<DayOfWeek> days = ArenaRules.parseDays(raw("days"));
        return days.isEmpty() ? ArenaRules.parseDays(FIELDS.get("days").def()) : days;
    }

    public LocalTime startTime() {
        LocalTime t = ArenaRules.parseTime(raw("start_time"));
        return t != null ? t : LocalTime.of(20, 0);
    }

    public List<Integer> levels() {
        List<Integer> l = ArenaRules.parseInts(raw("levels"), 1, 5);
        return l.isEmpty() ? List.of(1, 2, 3, 4, 5) : l;
    }

    public List<String> topics() { return ArenaRules.parseWords(raw("topics")); }

    public List<Integer> rewardCoins() {
        List<Integer> l = parseCoins();
        return l.isEmpty() ? List.of(300, 200, 100) : l;
    }

    private List<Integer> parseCoins() {
        // keep zeros and the order: "0,200,100" means no prize for first place
        List<Integer> out = new java.util.ArrayList<>();
        for (String p : raw("reward_coins").split("[,;\\s]+")) {
            try {
                out.add(Math.min(Math.max(Integer.parseInt(p.trim()), 0), 100000));
            } catch (NumberFormatException ignored) {
                // skip
            }
            if (out.size() == 3) break;
        }
        return out;
    }

    public ArenaRules.Timing timing(java.time.LocalDate day) {
        LocalDateTime starts = day.atTime(startTime());
        return new ArenaRules.Timing(starts, starts.minusMinutes(num("open_minutes")), num("question_count"),
                num("countdown_seconds"), num("answer_seconds"), num("reveal_seconds"), num("gap_seconds"));
    }

    public Map<String, Object> asMap() {
        Map<String, Object> values = new LinkedHashMap<>();
        for (String key : FIELDS.keySet()) {
            Field f = FIELDS.get(key);
            values.put(key, BOOL.equals(f.type()) ? (Object) flag(key) : INT.equals(f.type()) ? (Object) num(key) : raw(key));
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("values", values);
        out.put("fields", List.copyOf(FIELDS.values()));
        return out;
    }

    /** Saves what is sent (key → value); returns the problem in Vietnamese, or null. Nothing is written when there is a problem. */
    public String save(Map<String, Object> body) {
        Map<String, String> merged = new LinkedHashMap<>();
        for (String key : FIELDS.keySet()) merged.put(key, raw(key));
        Map<String, String> changed = new LinkedHashMap<>();
        for (Map.Entry<String, Object> e : body.entrySet()) {
            Field f = FIELDS.get(e.getKey());
            if (f == null) continue;
            String value = normalize(f, e.getValue());
            if (value == null) return "Giá trị không hợp lệ: " + f.label();
            String problem = rangeProblem(f, value);
            if (problem != null) return problem;
            merged.put(f.key(), value);
            changed.put(f.key(), value);
        }
        String problem = ArenaRules.validate(Integer.parseInt(merged.get("countdown_seconds")), Integer.parseInt(merged.get("answer_seconds")),
                Integer.parseInt(merged.get("reveal_seconds")), Integer.parseInt(merged.get("gap_seconds")),
                ArenaRules.parseInts(merged.get("levels"), 1, 5), merged.get("start_time"), ArenaRules.parseDays(merged.get("days")));
        if (problem != null) return problem;
        changed.forEach((k, v) -> write("arena/" + k, v));
        return null;
    }

    private static String normalize(Field f, Object v) {
        if (v == null) return null;
        switch (f.type()) {
            case BOOL:
                if (v instanceof Boolean b) return b ? "1" : "0";
                String s = String.valueOf(v).trim();
                return s.equals("1") || s.equals("0") ? s : null;
            case INT:
                if (v instanceof Number n) return String.valueOf(n.intValue());
                try { return String.valueOf(Integer.parseInt(String.valueOf(v).trim())); } catch (NumberFormatException e) { return null; }
            default:
                return String.valueOf(v).trim().replaceAll("\\s*,\\s*", ",");
        }
    }

    private static String rangeProblem(Field f, String value) {
        if (INT.equals(f.type())) {
            int n = Integer.parseInt(value);
            if (n < f.min() || n > f.max()) return f.label() + " phải từ " + f.min() + " đến " + f.max();
        } else if (TIME.equals(f.type())) {
            if (ArenaRules.parseTime(value) == null) return "Giờ bắt đầu cần dạng HH:mm, ví dụ 20:00";
        } else if (CSV.equals(f.type()) && f.max() > 0 && !value.isEmpty()) {
            for (String p : value.split(",")) {
                try {
                    int n = Integer.parseInt(p.trim());
                    if (n < f.min() || n > f.max()) return f.label() + ": mỗi số phải từ " + f.min() + " đến " + f.max();
                } catch (NumberFormatException e) {
                    return f.label() + ": chỉ nhập số, cách nhau bằng dấu phẩy";
                }
            }
            if (value.isEmpty()) return f.label() + " không được để trống";
        }
        if (CSV.equals(f.type()) && f.max() > 0 && value.isEmpty()) return f.label() + " không được để trống";
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
