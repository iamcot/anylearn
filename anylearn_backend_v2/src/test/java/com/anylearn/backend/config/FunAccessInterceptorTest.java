package com.anylearn.backend.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FunAccessInterceptorTest {

    @Test
    void mapsPathsToGames() {
        assertEquals("quiz", FunAccessInterceptor.gameOf("/api/quiz/start"));
        assertEquals("sticker", FunAccessInterceptor.gameOf("/api/stickers"));
        assertEquals("explore", FunAccessInterceptor.gameOf("/api/explore/3/like"));
        assertEquals("checkin", FunAccessInterceptor.gameOf("/api/fun/checkin/claim"));
        assertEquals("checkin", FunAccessInterceptor.gameOf("/api/fun/missions"));
        assertEquals("checkin", FunAccessInterceptor.gameOf("/api/fun/missions/share/claim"));
        assertNull(FunAccessInterceptor.gameOf("/api/fun/access"));
        assertNull(FunAccessInterceptor.gameOf("/api/fun/coins"));
    }
}
