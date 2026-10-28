package com.anylearn.backend.service.sticker;

import com.anylearn.backend.service.fun.CoinService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** Sticker collections against the real schema (needs the database like the context test); every test rolls back. */
@SpringBootTest
@Transactional
class StickerCollectionsFlowTest {

    @Autowired StickerService stickers;
    @Autowired CoinService coins;
    @Autowired JdbcTemplate jdbc;

    private long user() {
        String phone = "09" + (long) (Math.random() * 100000000L);
        jdbc.update("INSERT INTO users (name, phone, refcode, password, role, created_at) VALUES ('Test', ?, ?, 'x', 'member', DATE_SUB(NOW(), INTERVAL 10 DAY))", phone, phone);
        long id = jdbc.queryForObject("SELECT id FROM users WHERE phone = ?", Long.class, phone);
        for (int i = 1; i <= 3; i++) jdbc.update("INSERT INTO fun_checkins (user_id, day, streak, points) VALUES (?, DATE_SUB(CURDATE(), INTERVAL ? DAY), ?, 0)", id, i, i);
        return id;
    }

    private long collection(String name, Integer reward, boolean active) {
        jdbc.update("INSERT INTO sticker_collections (name, reward_coins, active, sort_order) VALUES (?, ?, ?, 99)", name, reward, active ? 1 : 0);
        return jdbc.queryForObject("SELECT MAX(id) FROM sticker_collections", Long.class);
    }

    private long sticker(long collectionId, String name, String rarity) {
        jdbc.update("INSERT INTO sticker_defs (name, emoji, rarity, drop_weight, active, sort_order, collection_id) VALUES (?, '⭐', ?, 10, 1, 1, ?)", name, rarity, collectionId);
        return jdbc.queryForObject("SELECT MAX(id) FROM sticker_defs", Long.class);
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> collectionsOf(Map<String, Object> album) {
        return (List<Map<String, Object>>) album.get("collections");
    }

    private static Map<String, Object> byName(Map<String, Object> album, String name) {
        return collectionsOf(album).stream().filter(c -> name.equals(c.get("name"))).findFirst().orElseThrow();
    }

    @Test
    void theSeededStickersAreInTheFirstCollection() {
        Map<String, Object> album = stickers.album(user());
        Map<String, Object> first = collectionsOf(album).get(0);
        assertEquals("Leo ham học", first.get("name"));
        assertEquals(12, first.get("total"));
        assertEquals(0, first.get("owned"));
        assertEquals(false, first.get("rewardClaimed"));
    }

    @Test
    void albumGroupsStickersPerCollectionWithProgress() {
        long u = user();
        int base = (Integer) stickers.album(u).get("total");
        long c = collection("Bộ thử", null, true);
        long a = sticker(c, "Thử 1", "common");
        sticker(c, "Thử 2", "common");
        sticker(c, "Thử 3", "rare");
        stickers.grant(u, a, "admin", null, null);
        Map<String, Object> album = stickers.album(u);
        Map<String, Object> mine = byName(album, "Bộ thử");
        assertEquals(3, mine.get("total"));
        assertEquals(1, mine.get("owned"));
        assertEquals(base + 3, album.get("total"));
        long inCollection = ((List<?>) album.get("items")).stream().filter(i -> ((Map<?, ?>) i).get("collectionId").equals(c)).count();
        assertEquals(3, inCollection);
    }

    @Test
    void switchedOffCollectionIsHiddenUnlessThePlayerHoldsAStickerOfIt() {
        long u = user();
        int base = (Integer) stickers.album(u).get("total");
        long c = collection("Bộ đã tắt", null, false);
        long s = sticker(c, "Cũ 1", "common");
        sticker(c, "Cũ 2", "common");
        assertTrue(collectionsOf(stickers.album(u)).stream().noneMatch(x -> "Bộ đã tắt".equals(x.get("name"))));
        stickers.grant(u, s, "admin", null, null);
        Map<String, Object> shown = byName(stickers.album(u), "Bộ đã tắt");
        assertEquals(false, shown.get("active"));
        // it does not count towards the overall progress
        assertEquals(base, stickers.album(u).get("total"));
    }

    @Test
    void stickersOfASwitchedOffCollectionDoNotDrop() {
        long c = collection("Bộ tắt", null, false);
        long s = sticker(c, "Không rơi", "common");
        assertTrue(stickers.pool().stream().noneMatch(w -> w.id() == s));
        jdbc.update("UPDATE sticker_collections SET active = 1 WHERE id = ?", c);
        assertTrue(stickers.pool().stream().anyMatch(w -> w.id() == s));
    }

    @Test
    void dropsSpreadOverTheCollections() {
        long u = user();
        // only the new collection is left, then a second one: each is picked about half of the time
        jdbc.update("UPDATE sticker_collections SET active = 0");
        long c1 = collection("Bộ A", null, true);
        long a = sticker(c1, "A1", "common");
        long c2 = collection("Bộ B", null, true);
        long b = sticker(c2, "B1", "common");
        int inA = 0;
        for (int i = 0; i < 200; i++) {
            Map<String, Object> got = stickers.dropRandom(u, "admin", null);
            if (((Number) got.get("id")).longValue() == a) inA++;
        }
        assertTrue(inA > 60 && inA < 140, "spread was " + inA + " of 200");
        assertTrue(a != b);
    }

    @Test
    void albumRepairsGrantsAddedByHand() {
        long u = user();
        long c = collection("Bộ tay", null, true);
        long a = sticker(c, "Tay 1", "common");
        jdbc.update("INSERT INTO sticker_grants (user_id, sticker_id, source) VALUES (?, ?, 'admin')", u, a);
        jdbc.update("INSERT INTO sticker_grants (user_id, sticker_id, source) VALUES (?, ?, 'admin')", u, a);
        assertEquals(1, byName(stickers.album(u), "Bộ tay").get("owned"));
        assertEquals(2, stickers.ownedCount(u, a));
    }

    @Test
    void eachCollectionPaysItsOwnRewardOnce() {
        long u = user();
        long c = collection("Bộ nhỏ", 50, true);
        long a = sticker(c, "Nhỏ 1", "common");
        long b = sticker(c, "Nhỏ 2", "common");
        stickers.grant(u, a, "admin", null, null);
        assertThrows(IllegalStateException.class, () -> stickers.claimSetReward(u, c));
        stickers.grant(u, b, "admin", null, null);
        assertEquals(true, byName(stickers.album(u), "Bộ nhỏ").get("complete"));
        Map<String, Object> claim = stickers.claimSetReward(u, c);
        assertEquals(50, claim.get("points"));
        assertEquals(50L, coins.balance(u));
        assertEquals(true, byName(stickers.album(u), "Bộ nhỏ").get("rewardClaimed"));
        assertThrows(IllegalStateException.class, () -> stickers.claimSetReward(u, c));
        // the big collection is still not complete and has its own claim
        long first = collectionsOf(stickers.album(u)).get(0).get("id") instanceof Long l ? l : 0;
        assertThrows(IllegalStateException.class, () -> stickers.claimSetReward(u, first));
    }

    @Test
    void aCollectionWithoutItsOwnRewardUsesTheGlobalSetting() {
        long u = user();
        long c = collection("Bộ mặc định", null, true);
        sticker(c, "Mặc định 1", "common");
        Map<String, Object> mine = byName(stickers.album(u), "Bộ mặc định");
        assertEquals(200, mine.get("rewardPoints"));
    }

    @Test
    void unknownOrSwitchedOffCollectionCannotBeClaimed() {
        long u = user();
        assertThrows(IllegalStateException.class, () -> stickers.claimSetReward(u, 999999));
        long c = collection("Bộ tắt 2", 10, false);
        sticker(c, "X", "common");
        assertThrows(IllegalStateException.class, () -> stickers.claimSetReward(u, c));
    }
}
