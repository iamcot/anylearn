package com.anylearn.backend.service.shop;

import com.anylearn.backend.entity.Configuration;
import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.service.quiz.QuizGameSettings;
import com.anylearn.backend.service.quiz.QuizItems;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Numbers of the Leo Xu shop (plan 15), rows `shop/*` of the configurations table, edited on the back office page "Cửa hàng Leo Xu".
 * The prices of the quiz items stay `quiz/price_*` ({@link QuizGameSettings}); this class holds everything else. Every number has a default.
 */
@Component
public class ShopSettings {

    private static final Map<String, QuizGameSettings.Field> FIELDS = new LinkedHashMap<>();

    private static void field(String key, String label, String group, int def, int min, int max) {
        FIELDS.put(key, new QuizGameSettings.Field(key, label, group, def, min, max));
    }

    static {
        String[] levels = {"Rất dễ", "Dễ", "Vừa", "Khó", "Rất khó"};
        for (int i = 0; i < levels.length; i++) {
            field("pack_price_l" + (i + 1), "Giá gói tập luyện cấp " + levels[i] + " (xu)", "Gói tập luyện", ShopRules.DEFAULT_LEVEL_PRICES[i], 0, 100000);
        }
        field("pack_price_topic", "Giá gói theo chủ đề, mọi cấp (xu)", "Gói tập luyện", 10, 0, 100000);
        field("pack_daily_cap", "Số gói tập luyện mua tối đa mỗi ngày", "Gói tập luyện", 10, 0, 1000);
        field("energy_price", "Giá một lần nạp năng lượng (xu)", "Năng lượng", 10, 0, 100000);
        field("energy_amount", "Năng lượng được cộng mỗi lần nạp", "Năng lượng", 10, 1, 1000);
        field("energy_daily_cap", "Số lần nạp năng lượng tối đa mỗi ngày", "Năng lượng", 3, 0, 1000);
        field("chest_normal_price", "Giá rương sticker thường (xu)", "Rương sticker", 30, 0, 100000);
        field("chest_normal_cap", "Số rương thường mua tối đa mỗi ngày", "Rương sticker", 3, 0, 1000);
        field("chest_rare_price", "Giá rương sticker hiếm (xu)", "Rương sticker", 90, 0, 100000);
        field("chest_rare_cap", "Số rương hiếm mua tối đa mỗi ngày", "Rương sticker", 1, 0, 1000);
        field("sell_sticker_common", "Leo mua sticker trùng loại thường (xu)", "Bán lại cho Leo", 3, 0, 100000);
        field("sell_sticker_rare", "Leo mua sticker trùng loại hiếm (xu)", "Bán lại cho Leo", 10, 0, 100000);
        field("sell_sticker_epic", "Leo mua sticker trùng loại siêu hiếm (xu)", "Bán lại cho Leo", 30, 0, 100000);
        field("sell_sticker_cap", "Số sticker bán tối đa mỗi ngày", "Bán lại cho Leo", 10, 0, 1000);
        field("sell_item_percent", "Giá bán lại vật phẩm Leo rank (% giá mua)", "Bán lại cho Leo", 30, 0, 100);
        field("sell_item_cap", "Số vật phẩm bán tối đa mỗi ngày", "Bán lại cho Leo", 5, 0, 1000);
        for (String key : ShopRules.SWITCHES) {
            field("on_" + key, "Bán " + switchLabel(key) + " (1 = bật, 0 = tắt)", "Công tắc từng món", 1, 0, 1);
        }
        field("on_sell_sticker", "Cho bán sticker trùng cho Leo (1 = bật, 0 = tắt)", "Công tắc từng món", 1, 0, 1);
        field("on_sell_item", "Cho bán lại vật phẩm cho Leo (1 = bật, 0 = tắt)", "Công tắc từng món", 1, 0, 1);
    }

    /** The name of a catalog key in the admin form. */
    public static String switchLabel(String key) {
        if (QuizItems.LABELS.containsKey(key)) return QuizItems.LABELS.get(key);
        return switch (key) {
            case ShopRules.PACK_LEVEL -> "gói tập luyện theo cấp độ";
            case ShopRules.PACK_TOPIC -> "gói tập luyện theo chủ đề";
            case ShopRules.PACK_TOPIC_LEVEL -> "gói tập luyện chủ đề + cấp";
            case ShopRules.ENERGY -> "năng lượng";
            case ShopRules.CHEST_NORMAL -> "rương sticker thường";
            case ShopRules.CHEST_RARE -> "rương sticker hiếm";
            default -> key;
        };
    }

    private final ConfigurationRepository configurationRepository;

    public ShopSettings(ConfigurationRepository configurationRepository) {
        this.configurationRepository = configurationRepository;
    }

    /** Master switch of the whole shop. */
    public boolean enabled() {
        return !"0".equals(read("shop/enabled").orElse("1").trim());
    }

    public int n(String name) {
        QuizGameSettings.Field f = FIELDS.get(name);
        try {
            int value = Integer.parseInt(read("shop/" + name).orElse(String.valueOf(f.def())).trim());
            return Math.min(Math.max(value, f.min()), f.max());
        } catch (NumberFormatException e) {
            return f.def();
        }
    }

    /** Whether one catalog key (or `sell_sticker`, `sell_item`) is on. */
    public boolean on(String key) {
        return n("on_" + key) == 1;
    }

    public List<Integer> levelPrices() {
        List<Integer> out = new ArrayList<>();
        for (int i = 1; i <= 5; i++) out.add(n("pack_price_l" + i));
        return out;
    }

    public int stickerSellPrice(String rarity) {
        return ShopRules.stickerSellPrice(rarity, n("sell_sticker_common"), n("sell_sticker_rare"), n("sell_sticker_epic"));
    }

    public Map<String, Object> asMap() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", enabled());
        Map<String, Object> numbers = new LinkedHashMap<>();
        for (String name : FIELDS.keySet()) numbers.put(name, n(name));
        out.put("numbers", numbers);
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
        if (body.get("enabled") instanceof Boolean b) write("shop/enabled", b ? "1" : "0");
        if (body.get("numbers") instanceof Map<?, ?> numbers) {
            for (Map.Entry<?, ?> e : numbers.entrySet()) {
                if (FIELDS.containsKey(String.valueOf(e.getKey())) && e.getValue() instanceof Number v) {
                    write("shop/" + e.getKey(), String.valueOf(v.intValue()));
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
