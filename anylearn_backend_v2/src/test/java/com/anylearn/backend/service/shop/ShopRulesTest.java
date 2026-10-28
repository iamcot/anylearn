package com.anylearn.backend.service.shop;

import com.anylearn.backend.service.sticker.StickerRules;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class ShopRulesTest {

    private static final List<Integer> LEVELS = List.of(5, 7, 9, 12, 15);

    @Test
    void packTypeFromKey() {
        assertEquals("level", ShopRules.packType("pack_level"));
        assertEquals("topic", ShopRules.packType("pack_topic"));
        assertEquals("topic_level", ShopRules.packType("pack_topic_level"));
        assertNull(ShopRules.packType("energy"));
        assertNull(ShopRules.packType(null));
    }

    @Test
    void packPriceFollowsTheLevel() {
        assertEquals(5, ShopRules.packPrice("level", 1, LEVELS, 10));
        assertEquals(12, ShopRules.packPrice("level", 4, LEVELS, 10));
        assertEquals(15, ShopRules.packPrice("topic_level", 5, LEVELS, 10));
        assertEquals(10, ShopRules.packPrice("topic", null, LEVELS, 10));
        assertEquals(10, ShopRules.packPrice("topic", 3, LEVELS, 10));
    }

    @Test
    void packPriceNeedsAValidLevel() {
        assertThrows(IllegalArgumentException.class, () -> ShopRules.packPrice("level", null, LEVELS, 10));
        assertThrows(IllegalArgumentException.class, () -> ShopRules.packPrice("level", 0, LEVELS, 10));
        assertThrows(IllegalArgumentException.class, () -> ShopRules.packPrice("topic_level", 6, LEVELS, 10));
        assertThrows(IllegalArgumentException.class, () -> ShopRules.packPrice("other", 2, LEVELS, 10));
    }

    @Test
    void sellPriceIsAPercentRoundedDownWithAMinimumOfOne() {
        assertEquals(9, ShopRules.sellPrice(30, 30));
        assertEquals(4, ShopRules.sellPrice(15, 30));
        assertEquals(18, ShopRules.sellPrice(60, 30));
        assertEquals(1, ShopRules.sellPrice(2, 30));
        assertEquals(1, ShopRules.sellPrice(0, 30));
        assertEquals(1, ShopRules.sellPrice(40, 0));
    }

    @Test
    void stickerSellPriceByRarity() {
        assertEquals(3, ShopRules.stickerSellPrice("common", 3, 10, 30));
        assertEquals(10, ShopRules.stickerSellPrice("rare", 3, 10, 30));
        assertEquals(30, ShopRules.stickerSellPrice("epic", 3, 10, 30));
        assertEquals(3, ShopRules.stickerSellPrice(null, 3, 10, 30));
    }

    @Test
    void leftUnderACap() {
        assertEquals(3, ShopRules.left(3, 0));
        assertEquals(1, ShopRules.left(3, 2));
        assertEquals(0, ShopRules.left(3, 5));
        assertEquals(0, ShopRules.left(0, 0));
    }

    @Test
    void rareChestKeepsRareAndEpicOnly() {
        List<StickerRules.Weighted> all = List.of(new StickerRules.Weighted(1, "common", 50), new StickerRules.Weighted(2, "rare", 10),
                new StickerRules.Weighted(3, "epic", 2));
        List<StickerRules.Weighted> pool = ShopRules.rareChestPool(all);
        assertEquals(List.of(2L, 3L), pool.stream().map(StickerRules.Weighted::id).toList());
        assertTrue(ShopRules.rareChestPool(List.of(new StickerRules.Weighted(1, "common", 50))).isEmpty());
    }

    @Test
    void levelPackOptions() {
        Set<String> valid = Set.of("english", "music", "art");
        assertNull(ShopRules.packOptions("level", null, valid).topics());
        assertNull(ShopRules.packOptions("level", List.of(), valid).topics());
        assertNull(ShopRules.packOptions("level", List.of("english", "music", "art"), valid).topics());
        assertEquals(List.of("music", "art"), ShopRules.packOptions("level", List.of("music", "art", "music"), valid).topics());
        assertNull(ShopRules.packOptions("level", List.of("music"), valid).topic());
        assertThrows(IllegalArgumentException.class, () -> ShopRules.packOptions("level", List.of("nope"), valid));
    }

    @Test
    void topicPackOptionsNeedExactlyOne() {
        Set<String> valid = Set.of("english", "music");
        ShopRules.PackOptions one = ShopRules.packOptions("topic", List.of("music"), valid);
        assertEquals("music", one.topic());
        assertEquals(List.of("music"), one.topics());
        assertEquals("english", ShopRules.packOptions("topic_level", List.of("english"), valid).topic());
        assertThrows(IllegalArgumentException.class, () -> ShopRules.packOptions("topic", List.of(), valid));
        assertThrows(IllegalArgumentException.class, () -> ShopRules.packOptions("topic_level", List.of("english", "music"), valid));
        assertThrows(IllegalArgumentException.class, () -> ShopRules.packOptions("weird", List.of("music"), valid));
    }
}
