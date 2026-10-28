package com.anylearn.backend.service.sticker;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class StickerMarketRulesTest {

    private final Map<Long, String> rarity = Map.of(1L, "rare", 2L, "rare", 3L, "rare", 4L, "rare", 5L, "common", 9L, "rare");

    @Test
    void listedCopiesComeOffTheTradableOnes() {
        assertEquals(2, StickerRules.tradableCopies(3, 0, 0));
        assertEquals(1, StickerRules.tradableCopies(3, 0, 1));
        assertEquals(0, StickerRules.tradableCopies(3, 0, 2));
        assertEquals(0, StickerRules.tradableCopies(3, 0, 5));
        assertEquals(0, StickerRules.tradableCopies(3, 2, 1));
        assertEquals(2, StickerRules.tradableCopies(4, 2, 0));
        assertEquals(1, StickerRules.tradableCopies(4, 2, 1));
        assertEquals(0, StickerRules.tradableCopies(1, 0, 0));
    }

    @Test
    void newListingNeedsDuplicatesOfTheSameRarityAndAMissingWish() {
        Map<Long, Integer> tradable = Map.of(1L, 1, 2L, 2, 3L, 0, 5L, 1);
        assertNull(StickerMarketRules.createProblem(List.of(1L, 2L), 9, rarity, tradable, 0, 0, 3));
        assertNotNull(StickerMarketRules.createProblem(List.of(), 9, rarity, tradable, 0, 0, 3));
        assertNotNull(StickerMarketRules.createProblem(List.of(1L, 2L, 3L, 4L), 9, rarity, tradable, 0, 0, 3), "at most 3");
        assertNotNull(StickerMarketRules.createProblem(List.of(1L, 1L), 9, rarity, tradable, 0, 0, 3), "duplicates in the list");
        assertNotNull(StickerMarketRules.createProblem(List.of(5L), 9, rarity, tradable, 0, 0, 3), "other rarity");
        assertNotNull(StickerMarketRules.createProblem(List.of(3L), 9, rarity, tradable, 0, 0, 3), "no spare copy");
        assertNotNull(StickerMarketRules.createProblem(List.of(1L), 9, rarity, tradable, 1, 0, 3), "already owns the wish");
        assertNotNull(StickerMarketRules.createProblem(List.of(1L), 1, rarity, tradable, 0, 0, 3), "gives and wants the same");
        assertNotNull(StickerMarketRules.createProblem(List.of(1L), 9, rarity, tradable, 0, 3, 3), "too many open listings");
        assertNotNull(StickerMarketRules.createProblem(List.of(1L), 99, rarity, tradable, 0, 0, 3), "unknown wish");
    }

    @Test
    void takeChecksOwnerStateAndStickers() {
        List<Long> offered = List.of(1L, 2L);
        assertNull(StickerMarketRules.takeProblem(10, 20, true, false, offered, 1, 0, 1));
        assertNotNull(StickerMarketRules.takeProblem(10, 10, true, false, offered, 1, 0, 1), "own listing");
        assertNotNull(StickerMarketRules.takeProblem(10, 20, false, false, offered, 1, 0, 1), "closed");
        assertNotNull(StickerMarketRules.takeProblem(10, 20, true, true, offered, 1, 0, 1), "expired");
        assertNotNull(StickerMarketRules.takeProblem(10, 20, true, false, offered, 7, 0, 1), "not offered");
        assertNotNull(StickerMarketRules.takeProblem(10, 20, true, false, offered, 1, 1, 1), "already has it");
        assertNotNull(StickerMarketRules.takeProblem(10, 20, true, false, offered, 1, 0, 0), "nothing to give");
    }

    @Test
    void matchNeedsSomethingMissingAndSomethingToGive() {
        List<Long> offered = List.of(1L, 2L, 3L);
        Map<Long, Integer> owned = Map.of(1L, 1, 2L, 2, 9L, 3);
        Map<Long, Integer> tradable = Map.of(2L, 1, 9L, 2);
        assertEquals(List.of(3L), StickerMarketRules.lackingOf(offered, owned));
        assertTrue(StickerMarketRules.matches(offered, 9, owned, tradable));
        assertFalse(StickerMarketRules.matches(offered, 8, owned, tradable), "viewer cannot give the wish");
        assertFalse(StickerMarketRules.matches(List.of(1L, 2L), 9, owned, tradable), "viewer has all offered");
        assertFalse(StickerMarketRules.canTake(10, 10, offered, 9, owned, tradable), "own listing");
        assertTrue(StickerMarketRules.canTake(10, 11, offered, 9, owned, tradable));
    }

    @Test
    void expiry() {
        LocalDateTime now = LocalDateTime.of(2026, 10, 28, 12, 0);
        assertEquals(now.plusDays(7), StickerMarketRules.expiresAt(now, 7));
        assertEquals(now.plusDays(1), StickerMarketRules.expiresAt(now, 0));
        assertFalse(StickerMarketRules.isExpired(now.plusMinutes(1), now));
        assertTrue(StickerMarketRules.isExpired(now, now));
        assertTrue(StickerMarketRules.isExpired(now.minusDays(1), now));
        assertEquals(List.of(1L, 2L), StickerMarketRules.distinct(List.of(1L, 2L, 1L)));
    }
}
