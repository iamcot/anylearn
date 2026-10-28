package com.anylearn.backend.service.quiz;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Numbers of the rank quiz game, rows `quiz/*` of the configurations table, edited on the back office page "Quiz leo rank".
 * Every one has a default, so the game works without any row.
 */
@Component
public class QuizGameSettings {

    /** Name, label, default, min, max: one table drives reading, saving and the admin form. */
    public record Field(String key, String label, String group, int def, int min, int max) {}

    private static final Map<String, Field> FIELDS = new LinkedHashMap<>();

    private static void field(String key, String label, String group, int def, int min, int max) {
        FIELDS.put(key, new Field(key, label, group, def, min, max));
    }

    static {
        field("seconds", "Số giây trả lời một câu", "Ván chơi", 20, 5, 120);
        field("extra_seconds", "Giây cộng thêm của vật phẩm Thêm giờ", "Ván chơi", 15, 5, 60);
        field("no_repeat_days", "Số ngày không gặp lại cùng một câu", "Ván chơi", 30, 0, 365);
        field("real_votes_min", "Số lượt trả lời tối thiểu để Hỏi cộng đồng dùng số thật", "Ván chơi", 30, 5, 10000);
        field("rank_reward_coins", "Xu thưởng khi lên hạng mới (mỗi hạng một lần)", "Thưởng", 20, 0, 100000);
        field("drop_base", "Tỉ lệ rơi vật phẩm sau mỗi câu (%)", "Vật phẩm rơi", 12, 0, 100);
        field("drop_pity_step", "Tăng tỉ lệ rơi mỗi lần không rơi (%)", "Vật phẩm rơi", 4, 0, 100);
        field("drop_pity_max", "Số câu không rơi tối đa trước khi chắc chắn rơi", "Vật phẩm rơi", 12, 1, 1000);
        field("drop_wrong_bonus", "Cộng tỉ lệ rơi khi trả lời sai (%)", "Vật phẩm rơi", 8, 0, 100);
        field("drop_daily_cap", "Số vật phẩm rơi tối đa mỗi ngày", "Vật phẩm rơi", 8, 0, 1000);
        field("streak_every", "Đúng liên tiếp bao nhiêu câu thì chắc chắn có vật phẩm (0 = tắt)", "Vật phẩm rơi", 3, 0, 100);
        field("buy_daily_cap", "Số vật phẩm mua tối đa mỗi ngày", "Cửa hàng", 5, 0, 1000);
        for (String item : QuizItems.ALL) {
            field("price_" + item, "Giá " + QuizItems.LABELS.get(item) + " (xu)", "Cửa hàng", QuizItems.DEFAULT_PRICE.getOrDefault(item, 20), 0, 1000000);
        }
        for (String item : QuizItems.ALL) {
            field("weight_" + item, "Tỉ trọng rơi " + QuizItems.LABELS.get(item), "Tỉ trọng vật phẩm", QuizItems.DEFAULT_WEIGHT.getOrDefault(item, 0), 0, 1000);
        }
        field("board_month_sticker", "Top 3 tháng nhận thêm sticker (1 = có)", "Bảng xếp hạng", 1, 0, 1);
        field("board_auto", "Tự động tổng kết và trao thưởng (1 = bật)", "Bảng xếp hạng", 1, 0, 1);
    }

    private static final String BOARD_WEEK_ITEMS = "quiz/board_week_items";
    private static final String BOARD_MONTH_ITEMS = "quiz/board_month_items";
    private static final String RANK_STARS = "quiz/rank_stars";

    private final ConfigurationRepository configurationRepository;

    public QuizGameSettings(ConfigurationRepository configurationRepository) {
        this.configurationRepository = configurationRepository;
    }

    public boolean enabled() {
        return !"0".equals(read("quiz/game_enabled").orElse("1").trim());
    }

    private int n(String name) {
        Field f = FIELDS.get(name);
        try {
            int value = Integer.parseInt(read("quiz/" + name).orElse(String.valueOf(f.def())).trim());
            return Math.min(Math.max(value, f.min()), f.max());
        } catch (NumberFormatException e) {
            return f.def();
        }
    }

    /** Seconds to answer a question. */
    public int seconds() { return n("seconds"); }

    public int extraSeconds() { return n("extra_seconds"); }

    public List<Integer> rankStars() {
        return QuizProgress.parseStars(read(RANK_STARS).orElse(null));
    }

    /** Leo Xu given when a rank is reached for the first time. */
    public int rankRewardCoins() { return n("rank_reward_coins"); }

    /** Drop chance after a question, in percent. */
    public double dropBasePercent() { return n("drop_base"); }

    public double dropPityStepPercent() { return n("drop_pity_step"); }

    public int dropPityMax() { return n("drop_pity_max"); }

    public double dropWrongBonusPercent() { return n("drop_wrong_bonus"); }

    public int dropDailyCap() { return n("drop_daily_cap"); }

    /** Right answers in a row that always give an item (0 = off). */
    public int streakEvery() { return n("streak_every"); }

    public int price(String item) { return FIELDS.containsKey("price_" + item) ? n("price_" + item) : 20; }

    public int weight(String item) { return FIELDS.containsKey("weight_" + item) ? n("weight_" + item) : 0; }

    /** Items a person can buy in one day. */
    public int buyDailyCap() { return n("buy_daily_cap"); }

    /** Days a person does not see the same question again. */
    public int noRepeatDays() { return n("no_repeat_days"); }

    /** Answers a question needs before "ask the community" shows real shares instead of a simulation. */
    public int realVotesMin() { return n("real_votes_min"); }

    /** Random items for the top 3 of a finished week (first, second, third place). */
    public List<Integer> boardWeekItems() {
        return QuizBoardRules.parsePrizes(read(BOARD_WEEK_ITEMS).orElse(null), List.of(3, 2, 1));
    }

    public List<Integer> boardMonthItems() {
        return QuizBoardRules.parsePrizes(read(BOARD_MONTH_ITEMS).orElse(null), List.of(5, 3, 2));
    }

    public boolean boardMonthSticker() { return n("board_month_sticker") == 1; }

    public boolean boardAuto() { return n("board_auto") == 1; }

    public Map<String, Object> asMap() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", enabled());
        out.put("rankStars", String.join(",", rankStars().stream().map(String::valueOf).toList()));
        out.put("boardWeekItems", String.join(",", boardWeekItems().stream().map(String::valueOf).toList()));
        out.put("boardMonthItems", String.join(",", boardMonthItems().stream().map(String::valueOf).toList()));
        Map<String, Object> numbers = new LinkedHashMap<>();
        for (String name : FIELDS.keySet()) numbers.put(name, n(name));
        out.put("numbers", numbers);
        return out;
    }

    /** The form description: every number with its label, group, default and range. */
    public List<Field> fields() {
        return List.copyOf(FIELDS.values());
    }

    /** Saves what is sent; a value outside its range is an error so the form can say which one. */
    public String save(Map<String, Object> body) {
        if (body.get("rankStars") instanceof String s) {
            if (!s.matches("\\s*\\d+(\\s*,\\s*\\d+){6}\\s*") || !QuizProgress.parseStars(s).equals(parseExact(s))) return "Số sao mỗi hạng cần đúng 7 số từ 1 đến 100, cách nhau bằng dấu phẩy";
        }
        for (String key : List.of("boardWeekItems", "boardMonthItems")) {
            if (body.get(key) instanceof String s && !s.isBlank()
                    && (!s.matches("\\s*\\d+(\\s*,\\s*\\d+){0,2}\\s*") || QuizBoardRules.parsePrizes(s, null) == null)) {
                return "Phần thưởng top 3 cần 1 đến 3 số từ 0 đến 20, cách nhau bằng dấu phẩy";
            }
        }
        if (body.get("numbers") instanceof Map<?, ?> numbers) {
            for (Map.Entry<?, ?> e : numbers.entrySet()) {
                Field f = FIELDS.get(String.valueOf(e.getKey()));
                if (f == null) continue;
                if (!(e.getValue() instanceof Number v)) return "Giá trị không hợp lệ: " + f.label();
                if (v.intValue() < f.min() || v.intValue() > f.max()) return f.label() + " phải từ " + f.min() + " đến " + f.max();
            }
        }
        if (body.get("enabled") instanceof Boolean b) write("quiz/game_enabled", b ? "1" : "0");
        if (body.get("rankStars") instanceof String s) write(RANK_STARS, s.replaceAll("\\s", ""));
        if (body.get("boardWeekItems") instanceof String s && !s.isBlank()) write(BOARD_WEEK_ITEMS, s.replaceAll("\\s", ""));
        if (body.get("boardMonthItems") instanceof String s && !s.isBlank()) write(BOARD_MONTH_ITEMS, s.replaceAll("\\s", ""));
        if (body.get("numbers") instanceof Map<?, ?> numbers) {
            for (Map.Entry<?, ?> e : numbers.entrySet()) {
                if (FIELDS.containsKey(String.valueOf(e.getKey())) && e.getValue() instanceof Number v) {
                    write("quiz/" + e.getKey(), String.valueOf(v.intValue()));
                }
            }
        }
        return null;
    }

    private static List<Integer> parseExact(String text) {
        return java.util.Arrays.stream(text.split(",")).map(p -> Integer.parseInt(p.trim())).toList();
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
