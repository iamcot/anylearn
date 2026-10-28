package com.anylearn.backend.service.shop;

import com.anylearn.backend.service.quiz.QuizItems;
import com.anylearn.backend.service.sticker.StickerRules;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/** Pure rules of the Leo Xu shop (plan 15): the catalog keys, prices of packs, sell-back prices, daily limits and pack options. */
public final class ShopRules {

    private ShopRules() {}

    // catalog keys (a quiz item uses its own key from QuizItems)
    public static final String PACK_LEVEL = "pack_level";
    public static final String PACK_TOPIC = "pack_topic";
    public static final String PACK_TOPIC_LEVEL = "pack_topic_level";
    public static final String ENERGY = "energy";
    public static final String CHEST_NORMAL = "chest_normal";
    public static final String CHEST_RARE = "chest_rare";

    public static final List<String> PACK_KEYS = List.of(PACK_LEVEL, PACK_TOPIC, PACK_TOPIC_LEVEL);
    /** Keys that have an on/off switch in the back office. */
    public static final List<String> SWITCHES = new ArrayList<>();
    static {
        SWITCHES.addAll(QuizItems.ALL);
        SWITCHES.addAll(PACK_KEYS);
        SWITCHES.add(ENERGY);
        SWITCHES.add(CHEST_NORMAL);
        SWITCHES.add(CHEST_RARE);
    }

    // kinds written in `shop_log`
    public static final String LOG_PACK = "pack";
    public static final String LOG_ENERGY = "energy";
    public static final String LOG_CHEST_NORMAL = "chest_normal";
    public static final String LOG_CHEST_RARE = "chest_rare";
    public static final String LOG_SELL_STICKER = "sell_sticker";
    public static final String LOG_SELL_ITEM = "sell_item";

    // pack types stored in `quiz_packs.type`
    public static final String TYPE_LEVEL = "level";
    public static final String TYPE_TOPIC = "topic";
    public static final String TYPE_TOPIC_LEVEL = "topic_level";

    public static final int[] DEFAULT_LEVEL_PRICES = {5, 7, 9, 12, 15};

    public static boolean isPackKey(String key) {
        return PACK_KEYS.contains(key);
    }

    /** `pack_level` -> `level` and so on; null for anything else. */
    public static String packType(String key) {
        return switch (key == null ? "" : key) {
            case PACK_LEVEL -> TYPE_LEVEL;
            case PACK_TOPIC -> TYPE_TOPIC;
            case PACK_TOPIC_LEVEL -> TYPE_TOPIC_LEVEL;
            default -> null;
        };
    }

    /** A level-based pack is bought at a chosen difficulty; a pack of one topic over every level has one price. */
    public static boolean needsDifficulty(String type) {
        return TYPE_LEVEL.equals(type) || TYPE_TOPIC_LEVEL.equals(type);
    }

    public static String packLabel(String type) {
        return switch (type == null ? "" : type) {
            case TYPE_LEVEL -> "Gói theo cấp độ";
            case TYPE_TOPIC -> "Gói theo chủ đề";
            case TYPE_TOPIC_LEVEL -> "Gói chủ đề + cấp";
            default -> "Gói tập luyện";
        };
    }

    /** Price of a pack: by its level for the level based types, one price for the topic pack. Throws for a missing or wrong level. */
    public static int packPrice(String type, Integer difficulty, List<Integer> levelPrices, int topicPrice) {
        if (TYPE_TOPIC.equals(type)) return topicPrice;
        if (!TYPE_LEVEL.equals(type) && !TYPE_TOPIC_LEVEL.equals(type)) throw new IllegalArgumentException("Loại gói không hợp lệ");
        if (difficulty == null || difficulty < 1 || difficulty > levelPrices.size()) throw new IllegalArgumentException("Chọn cấp độ cho gói này");
        return levelPrices.get(difficulty - 1);
    }

    /** What Leo pays for an item back: a percent of its buy price, rounded down, at least 1. */
    public static int sellPrice(int buyPrice, int percent) {
        return Math.max(1, (int) Math.floor(Math.max(buyPrice, 0) * Math.max(percent, 0) / 100.0));
    }

    public static int stickerSellPrice(String rarity, int common, int rare, int epic) {
        return switch (rarity == null ? "" : rarity) {
            case StickerRules.EPIC -> epic;
            case StickerRules.RARE -> rare;
            default -> common;
        };
    }

    /** Uses left today under a cap (0 = nothing may be done today). */
    public static int left(int cap, int used) {
        return Math.max(cap - Math.max(used, 0), 0);
    }

    /** The stickers a rare chest can give: rare or epic only. */
    public static List<StickerRules.Weighted> rareChestPool(List<StickerRules.Weighted> all) {
        List<StickerRules.Weighted> out = new ArrayList<>();
        for (StickerRules.Weighted w : all) {
            if (StickerRules.RARE.equals(w.rarity()) || StickerRules.EPIC.equals(w.rarity())) out.add(w);
        }
        return out;
    }

    /** What a pack is set to after the person saves its options. */
    public record PackOptions(String topic, List<String> topics) {}

    /**
     * Checks the options of a pack: a level pack takes any number of topics (none = every topic); a topic pack and a topic + level pack take exactly one.
     * `valid` = the keys of topics that are on. Throws with a Vietnamese text.
     */
    public static PackOptions packOptions(String type, List<String> requested, Set<String> valid) {
        Set<String> clean = new LinkedHashSet<>();
        if (requested != null) {
            for (String key : requested) {
                if (key == null || key.isBlank()) continue;
                if (!valid.contains(key.trim())) throw new IllegalArgumentException("Chủ đề không tồn tại");
                clean.add(key.trim());
            }
        }
        if (TYPE_LEVEL.equals(type)) {
            // every topic ticked is the same as none
            boolean all = clean.isEmpty() || clean.containsAll(valid);
            return new PackOptions(null, all ? null : new ArrayList<>(clean));
        }
        if (!TYPE_TOPIC.equals(type) && !TYPE_TOPIC_LEVEL.equals(type)) throw new IllegalArgumentException("Loại gói không hợp lệ");
        if (clean.size() != 1) throw new IllegalArgumentException("Chọn đúng một chủ đề cho gói này");
        String only = clean.iterator().next();
        return new PackOptions(only, List.of(only));
    }
}
