package com.anylearn.backend.service.acquisition;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** "Nguồn khách" against the real schema (needs the database like the context test); every test rolls back. */
@SpringBootTest
@Transactional
class AcquisitionFlowTest {

    @Autowired AcquisitionService acquisition;
    @Autowired JdbcTemplate jdbc;

    private long user() {
        String phone = "09" + (long) (Math.random() * 100000000L);
        jdbc.update("INSERT INTO users (name, phone, refcode, password, role, created_at) VALUES ('Khach Moi', ?, ?, 'x', 'member', NOW())", phone, phone);
        return jdbc.queryForObject("SELECT id FROM users WHERE phone = ?", Long.class, phone);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> row(Map<String, Object> report, String list, String key, String value) {
        return ((List<Map<String, Object>>) report.get(list)).stream().filter(r -> value.equals(r.get(key))).findFirst().orElseThrow();
    }

    @Test
    void signupsAndVisitsAreCountedByChannelCampaignAndVideo() {
        String campaign = "test-" + System.nanoTime();
        Map<String, String> utm = Map.of("utm_source", "Facebook", "utm_medium", "social", "utm_campaign", campaign, "utm_content", "video-1",
                "landing_path", "/fun/explore/77/clip", "first_seen_at", "2026-10-20T10:00:00Z");
        assertTrue(acquisition.trackLanding(utm, "10.0.0.1"));
        assertTrue(acquisition.trackLanding(utm, "10.0.0.2"));
        assertFalse(acquisition.trackLanding(Map.of("x", "y"), "10.0.0.3"));

        long buyer = user();
        acquisition.recordSignup(buyer, utm, null);
        acquisition.recordSignup(buyer, Map.of("utm_source", "zalo"), null);
        jdbc.update("INSERT INTO orders (user_id, amount, status, created_at) VALUES (?, 500000, 'delivered', NOW())", buyer);
        acquisition.recordSignup(user(), utm, null);

        assertEquals("facebook", jdbc.queryForObject("SELECT utm_source FROM user_acquisition WHERE user_id = ?", String.class, buyer));
        assertEquals(77L, jdbc.queryForObject("SELECT explore_post_id FROM user_acquisition WHERE user_id = ?", Long.class, buyer));

        Map<String, Object> report = acquisition.report(30);
        Map<String, Object> c = row(report, "campaigns", "campaign", campaign);
        assertEquals(2L, ((Number) c.get("visits")).longValue());
        assertEquals(2L, ((Number) c.get("signups")).longValue());
        assertEquals(1L, ((Number) c.get("buyers")).longValue());
        assertEquals(500000L, ((Number) c.get("revenue")).longValue());
        assertTrue(((Number) row(report, "channels", "channel", "facebook / social").get("signups")).longValue() >= 2);
    }

    @Test
    void anAccountWithoutUtmIsDirectOrReferral() {
        long direct = user();
        acquisition.recordSignup(direct, Map.of(), null);
        long invited = user();
        acquisition.recordSignup(invited, Map.of(), "0901234567");
        Map<String, Object> report = acquisition.report(7);
        assertTrue(((Number) row(report, "channels", "channel", "trực tiếp").get("signups")).longValue() >= 1);
        assertTrue(((Number) row(report, "channels", "channel", "giới thiệu").get("signups")).longValue() >= 1);
    }
}
