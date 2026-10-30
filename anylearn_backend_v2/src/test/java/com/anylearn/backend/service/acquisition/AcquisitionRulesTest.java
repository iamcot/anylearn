package com.anylearn.backend.service.acquisition;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class AcquisitionRulesTest {

    @Test
    void cleansValues() {
        assertEquals("facebook", AcquisitionRules.clean("utm_source", "  Facebook "));
        assertEquals("Video-12", AcquisitionRules.clean("utm_content", "Video-12"));
        assertNull(AcquisitionRules.clean("utm_source", "   "));
        assertEquals(AcquisitionRules.MAX_VALUE, AcquisitionRules.clean("utm_campaign", "x".repeat(300)).length());
        assertEquals(Map.of("utm_source", "zalo", "utm_campaign", "ra-mat-v2"),
                AcquisitionRules.utm(Map.of("utm_source", "Zalo", "utm_campaign", "ra-mat-v2", "utm_medium", "", "other", "x")));
    }

    @Test
    void cleansPaths() {
        assertEquals("/fun/explore/12/meo?utm_source=fb", AcquisitionRules.cleanPath("/fun/explore/12/meo?utm_source=fb#top"));
        assertNull(AcquisitionRules.cleanPath("https://evil.com/x"));
        assertNull(AcquisitionRules.cleanPath("//evil.com"));
    }

    @Test
    void findsTheExplorePost() {
        assertEquals(12L, AcquisitionRules.explorePostId("/fun/explore/12/meo-hay", null));
        assertEquals(12L, AcquisitionRules.explorePostId("/fun/explore/12?utm_source=fb", null));
        assertEquals(34L, AcquisitionRules.explorePostId("/search", "explore-34"));
        assertNull(AcquisitionRules.explorePostId("/fun/explore/mine", "video-tong-hop"));
    }

    @Test
    void readsFirstSeen() {
        LocalDateTime now = LocalDateTime.of(2026, 10, 29, 12, 0);
        assertNotNull(AcquisitionRules.firstSeen("2026-10-20T10:00:00Z", now));
        assertEquals(now, AcquisitionRules.firstSeen("2099-01-01T00:00:00Z", now));
        assertNull(AcquisitionRules.firstSeen("hôm qua", now));
    }

    @Test
    void namesChannels() {
        assertEquals("facebook / social", AcquisitionRules.channel("facebook", "social", null));
        assertEquals("facebook", AcquisitionRules.channel("facebook", null, null));
        assertEquals("giới thiệu", AcquisitionRules.channel(null, null, "0901234567"));
        assertEquals("trực tiếp", AcquisitionRules.channel(null, null, null));
        assertEquals(30, AcquisitionRules.days(14));
        assertEquals(7, AcquisitionRules.days(7));
    }
}
