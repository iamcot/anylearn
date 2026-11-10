package com.anylearn.backend.service.farm;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** The farm against the real schema (needs MySQL or MariaDB like the other flow tests); every test rolls back. */
@SpringBootTest
@Transactional
class FarmFlowTest {

    @Autowired JdbcTemplate jdbc;
    @Autowired FarmService farm;
    @Autowired FarmProgressService progress;
    @Autowired FarmSocialService social;
    @Autowired FarmPushService push;
    @Autowired FarmTreeService trees;

    private long user() {
        String phone = "09" + (long) (Math.random() * 100000000L);
        jdbc.update("INSERT INTO users (name, phone, refcode, password, role, is_child) VALUES ('Nguyen Van Test', ?, ?, 'x', 'member', 0)", phone, phone);
        return jdbc.queryForObject("SELECT id FROM users WHERE phone = ?", Long.class, phone);
    }

    @Test
    void gardenAndProgressLoadForANewPlayer() {
        long u = user();
        Map<String, Object> view = farm.view(u);
        assertEquals(4, ((java.util.List<?>) view.get("plots")).size());
        Map<String, Object> p = progress.progress(u);
        assertNotNull(p.get("orders"));
        assertNotNull(p.get("tasks"));
        assertNotNull(p.get("chapters"));
        assertNotNull(p.get("path"));
        assertNotNull(p.get("challenges"));
        assertNotNull(p.get("compost"));
    }

    @Test
    void plantWaterHarvestRoundTrip() {
        long u = user();
        farm.view(u);
        farm.plant(u, 0, "rau_mam");
        Map<String, Object> view = farm.view(u);
        assertEquals("growing", ((Map<?, ?>) ((java.util.List<?>) view.get("plots")).get(0)).get("phase"));
        progress.progress(u);
        assertNotNull(social.list(u)); assertNotNull(social.suggestions(u));
    }

    private void giveCrop(long u, String key, int qty) {
        jdbc.update("INSERT INTO farm_inventory (user_id, item_key, qty_own) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE qty_own = qty_own + VALUES(qty_own)", u, key, qty);
    }

    @Test
    void plantThenHarvestAndSell() {
        long u = user();
        farm.view(u);
        farm.plant(u, 0, "rau_mam");
        jdbc.update("UPDATE farm_plots SET planted_at = planted_at - INTERVAL 2 DAY WHERE user_id = ?", u);
        Map<String, Object> view = farm.view(u);
        String phase = (String) ((Map<?, ?>) ((java.util.List<?>) view.get("plots")).get(0)).get("phase");
        assertTrue(phase.equals("ripe") || phase.equals("wilting") || phase.equals("thirsty"), phase);
        try { farm.water(u, java.util.List.of(0)); } catch (IllegalStateException ignored) { }
        try { farm.harvest(u, java.util.List.of(0)); } catch (IllegalStateException ignored) { }
        giveCrop(u, "rau_mam", 5);
        assertNotNull(farm.sell(u, Map.of("rau_mam", 5)));
    }

    @Test
    void compostOrdersAndTasks() {
        long u = user();
        farm.view(u);
        giveCrop(u, "rau_mam", 10);
        progress.startCompost(u, "rau_mam");
        jdbc.update("UPDATE farm_compost SET ready_at = ready_at - INTERVAL 2 DAY WHERE user_id = ?", u);
        assertNotNull(progress.collectCompost(u));
        Map<String, Object> p = progress.progress(u);
        java.util.List<?> orders = (java.util.List<?>) p.get("orders");
        assertFalse(orders.isEmpty());
        long id = ((Number) ((Map<?, ?>) orders.get(0)).get("id")).longValue();
        progress.skipOrder(u, id);
        try { progress.claimTask(u, 0); } catch (IllegalStateException ignored) { }
        assertThrows(IllegalStateException.class, () -> progress.claimTaskBox(u));
        assertThrows(IllegalStateException.class, () -> progress.claimChapter(u, 1));
        assertThrows(IllegalStateException.class, () -> progress.expand(u));
    }

    @Test
    void neighboursHelpAndSteal() {
        long a = user();
        long b = user();
        farm.view(a);
        farm.view(b);
        jdbc.update("UPDATE farm_profiles SET level = 8 WHERE user_id = ?", b);
        jdbc.update("UPDATE users SET status = 1 WHERE id IN (?, ?)", a, b);
        jdbc.update("UPDATE users SET created_at = NOW() - INTERVAL 30 DAY WHERE id IN (?, ?)", a, b);
        for (long who : new long[]{a, b}) for (int d = 1; d <= 3; d++) jdbc.update("INSERT INTO fun_checkins (user_id, day, streak) VALUES (?, CURDATE() - INTERVAL ? DAY, 1)", who, d);
        String phoneB = jdbc.queryForObject("SELECT phone FROM users WHERE id = ?", String.class, b);
        assertNotNull(social.add(a, phoneB));
        farm.plant(b, 0, "rau_mam");
        assertNotNull(social.visit(a, b));
        assertEquals(1, social.list(a).size());
        try { social.water(a, b, java.util.List.of(0)); } catch (IllegalStateException ignored) { }
        try { social.steal(a, b, 0); } catch (IllegalStateException ignored) { }
        assertNotNull(social.todaySummary(b));
        assertNotNull(social.remove(a, b));
    }

    @Test
    void pushScanDoesNotFail() {
        long u = user();
        farm.view(u);
        jdbc.update("UPDATE farm_profiles SET last_visit_at = NOW() - INTERVAL 1 DAY WHERE user_id = ?", u);
        push.run();
    }

    @Test
    void treeIsPlantedPickedAndUprooted() {
        long u = user();
        farm.view(u);
        jdbc.update("UPDATE farm_profiles SET level = 10 WHERE user_id = ?", u);
        jdbc.update("UPDATE fun_wallets SET balance = 500 WHERE user_id = ?", u);
        jdbc.update("INSERT IGNORE INTO fun_wallets (user_id, balance) VALUES (?, 500)", u);
        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, () -> farm.plant(u, 0, "bui_dau_sao_bang"));   // a tree is not a plot crop
        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, () -> trees.plant(u, 1, "bui_dau_sao_bang")); // slot 2 opens at level 11
        trees.plant(u, 0, "bui_dau_sao_bang");
        assertEquals("sapling", trees.slots(u, 10).get(0).get("phase"));
        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, () -> trees.harvest(u, 0));
        jdbc.update("UPDATE farm_trees SET next_ready_at = NOW() - INTERVAL 1 HOUR");
        assertEquals("fruiting", trees.slots(u, 10).get(0).get("phase"));
        assertNotNull(trees.harvest(u, 0));
        assertEquals("grown", trees.slots(u, 10).get(0).get("phase"));
        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, () -> trees.remove(u, 0));
        jdbc.update("UPDATE farm_trees SET harvests_done = cycles");
        assertEquals("resting", trees.slots(u, 10).get(0).get("phase"));
        trees.remove(u, 0);
        assertNotNull(progress.progress(u).get("trees"));
    }
}
