package com.anylearn.backend.service.fun;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** The daily earning cap and the roll-out settings against the real schema; every test rolls back. */
@SpringBootTest
@Transactional
class FunAccessFlowTest {

    @Autowired CoinService coins;
    @Autowired FunSettings funSettings;
    @Autowired FunAccessSettings access;
    @Autowired JdbcTemplate jdbc;

    private long user() {
        String phone = "09" + (long) (Math.random() * 100000000L);
        jdbc.update("INSERT INTO users (name, phone, refcode, password, role, created_at) VALUES ('Test', ?, ?, 'x', 'member', NOW())", phone, phone);
        return jdbc.queryForObject("SELECT id FROM users WHERE phone = ?", Long.class, phone);
    }

    @Test
    void dailyCapCutsGameCoinsButNotAdminAdjustments() {
        long u = user();
        funSettings.saveDailyEarnCap(50);
        assertEquals(30, coins.credit(u, 30, CoinService.SOURCE_CHECKIN, "a"));
        assertEquals(50, coins.credit(u, 30, CoinService.SOURCE_QUIZ_RANK, "b"));
        assertEquals(50, coins.credit(u, 10, CoinService.SOURCE_CHECKIN, "c"));
        assertEquals(150, coins.credit(u, 100, CoinService.SOURCE_ADMIN, "d"));
        funSettings.saveDailyEarnCap(0);
        assertEquals(160, coins.credit(u, 10, CoinService.SOURCE_CHECKIN, "e"));
    }

    @Test
    void accessModesAreSavedPerGame() {
        assertEquals("all", access.mode("quiz"));
        access.save(Map.of("modes", Map.of("quiz", "testers"), "testers", "0912345678"));
        assertEquals("testers", access.mode("quiz"));
        assertEquals("all", access.mode("sticker"));
        assertEquals(1, access.testers().size());
    }
}
