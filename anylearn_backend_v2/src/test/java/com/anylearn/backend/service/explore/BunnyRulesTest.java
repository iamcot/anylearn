package com.anylearn.backend.service.explore;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class BunnyRulesTest {

    @Test
    void signatureIsSha256OfTheFourParts() {
        // sha256("12" + "abc" + "1700000000" + "vid-9")
        assertEquals("8b8ff9ff06ed28e8a316b5287bf0a01420d6fe81f72a5588511983d321ff8923", BunnyRules.signature("12", "abc", 1700000000L, "vid-9"));
        assertNotEquals(BunnyRules.signature("12", "abc", 1700000000L, "vid-9"), BunnyRules.signature("12", "abc", 1700000001L, "vid-9"));
    }

    @Test
    void linksUseTheCleanHost() {
        assertEquals("vz-1.b-cdn.net", BunnyRules.cleanHost(" https://vz-1.b-cdn.net/ "));
        assertEquals("https://vz-1.b-cdn.net/abc/playlist.m3u8", BunnyRules.playlistUrl("https://vz-1.b-cdn.net/", "abc"));
        assertEquals("https://vz-1.b-cdn.net/abc/thumbnail.jpg", BunnyRules.thumbnailUrl("vz-1.b-cdn.net", "abc"));
        assertEquals("", BunnyRules.cleanHost(null));
    }

    @Test
    void titleIsNeverEmptyAndShort() {
        assertEquals("Khám phá", BunnyRules.cleanTitle("  "));
        assertEquals("Khám phá", BunnyRules.cleanTitle(null));
        assertEquals(200, BunnyRules.cleanTitle("x".repeat(500)).length());
    }
}
