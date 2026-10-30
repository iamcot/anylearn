package com.anylearn.backend.service.studio;

import org.junit.jupiter.api.Test;

import java.security.SecureRandom;

import static org.junit.jupiter.api.Assertions.*;

class StudioRulesTest {

    @Test
    void keysLookRightAndHashTheSame() {
        String key = StudioRules.newKey(new SecureRandom());
        assertTrue(StudioRules.looksLikeKey(key));
        assertFalse(StudioRules.looksLikeKey("al_short"));
        assertFalse(StudioRules.looksLikeKey("xx_" + key.substring(3)));
        assertEquals(64, StudioRules.hash(key).length());
        assertEquals(StudioRules.hash(key), StudioRules.hash(key));
        assertEquals(key.substring(0, 8), StudioRules.prefixOf(key));
    }

    @Test
    void aKeyCallsOnlyCreatorAndStudioRoutes() {
        assertTrue(StudioRules.keyMayCall("/api/explore/creator/posts"));
        assertTrue(StudioRules.keyMayCall("/api/studio/stats"));
        assertFalse(StudioRules.keyMayCall("/api/explore"));
        assertFalse(StudioRules.keyMayCall("/api/cart/checkout"));
        assertFalse(StudioRules.keyMayCall("/admin/explore/posts"));
        assertFalse(StudioRules.keyMayCall(null));
    }

    @Test
    void socialValues() {
        assertEquals("facebook", StudioRules.cleanChannel(" Facebook "));
        assertThrows(IllegalArgumentException.class, () -> StudioRules.cleanChannel("myspace"));
        assertNull(StudioRules.cleanUrl(" "));
        assertThrows(IllegalArgumentException.class, () -> StudioRules.cleanUrl("javascript:alert(1)"));
        assertEquals("https://anylearn.vn/fun/explore/5/meo-hay?utm_source=zalo&utm_medium=social&utm_campaign=ra-mat-v2&utm_content=explore-5",
                StudioRules.postLink("https://anylearn.vn/", 5, "meo-hay", "zalo", "Ra mat v2"));
        assertTrue(StudioRules.postLink("https://anylearn.vn", 5, "x", "facebook", null).contains("utm_campaign=kham-pha"));
    }
}
