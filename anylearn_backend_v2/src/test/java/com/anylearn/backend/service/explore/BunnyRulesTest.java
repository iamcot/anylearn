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

    @Test
    void videoIdOnlyForOurLibrary() {
        String id = "3f0c2a6e-1b2c-4d5e-8f90-0123456789ab";
        assertEquals(id, BunnyRules.videoIdOf("vz-1.b-cdn.net", "https://vz-1.b-cdn.net/" + id + "/playlist.m3u8"));
        assertEquals(id, BunnyRules.videoIdOf("https://vz-1.b-cdn.net/", "https://vz-1.b-cdn.net/" + id + "/thumbnail.jpg"));
        assertNull(BunnyRules.videoIdOf("vz-1.b-cdn.net", "https://vz-2.b-cdn.net/" + id + "/playlist.m3u8"));
        assertNull(BunnyRules.videoIdOf("vz-1.b-cdn.net", "https://www.youtube.com/watch?v=abc"));
        assertNull(BunnyRules.videoIdOf("", "https://vz-1.b-cdn.net/" + id + "/playlist.m3u8"));
        assertNull(BunnyRules.videoIdOf("vz-1.b-cdn.net", "https://vz-1.b-cdn.net/../x"));
    }
}
