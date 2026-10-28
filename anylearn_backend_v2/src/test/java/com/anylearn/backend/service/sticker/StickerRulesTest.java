package com.anylearn.backend.service.sticker;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class StickerRulesTest {

    private final List<StickerRules.Weighted> pool = List.of(
            new StickerRules.Weighted(1, "common", 10),
            new StickerRules.Weighted(2, "rare", 5),
            new StickerRules.Weighted(3, "epic", 0));

    @Test
    void pickFollowsWeightsAndSkipsZero() {
        assertEquals(1, StickerRules.pickWeighted(pool, 0.0).id());
        assertEquals(1, StickerRules.pickWeighted(pool, 0.66).id());
        assertEquals(2, StickerRules.pickWeighted(pool, 0.67).id());
        assertEquals(2, StickerRules.pickWeighted(pool, 1.0).id());
        assertNull(StickerRules.pickWeighted(List.of(new StickerRules.Weighted(3, "epic", 0)), 0.5));
        assertNull(StickerRules.pickWeighted(List.of(), 0.5));
    }

    @Test
    void welcomePoolHasNoEpicAndRareOnlyWhenAllowed() {
        var all = List.of(new StickerRules.Weighted(1, "common", 1), new StickerRules.Weighted(2, "rare", 1), new StickerRules.Weighted(3, "epic", 1));
        assertEquals(1, StickerRules.welcomePool(all, false).size());
        assertEquals(2, StickerRules.welcomePool(all, true).size());
    }

    @Test
    void tradeNeedsTwoPeopleAndTheSameRarity() {
        assertNull(StickerRules.tradeProblem(1, 2, "rare", "rare"));
        assertNotNull(StickerRules.tradeProblem(1, 2, "common", "rare"));
        assertNotNull(StickerRules.tradeProblem(1, 1, "common", "common"));
        assertNotNull(StickerRules.tradeProblem(1, 2, null, "common"));
    }

    @Test
    void pairKeyIsTheSameBothWays() {
        assertEquals("3-9", StickerRules.pairKey(9, 3));
        assertEquals(StickerRules.pairKey(3, 9), StickerRules.pairKey(9, 3));
    }

    @Test
    void pairWindow() {
        LocalDateTime now = LocalDateTime.of(2026, 10, 28, 10, 0);
        assertFalse(StickerRules.pairBlocked(null, now, 30));
        assertTrue(StickerRules.pairBlocked(now.minusDays(29), now, 30));
        assertFalse(StickerRules.pairBlocked(now.minusDays(30), now, 30));
    }

    @Test
    void tradableCopiesKeepsTheFirstAndTheLockedOnes() {
        assertEquals(0, StickerRules.tradableCopies(1, 0));
        assertEquals(2, StickerRules.tradableCopies(3, 0));
        assertEquals(1, StickerRules.tradableCopies(3, 2));
        assertEquals(0, StickerRules.tradableCopies(2, 2));
    }

    @Test
    void eligibilityNeedsAgeAndCheckins() {
        assertTrue(StickerRules.eligible(3, 3, 3, 3));
        assertFalse(StickerRules.eligible(2, 5, 3, 3));
        assertFalse(StickerRules.eligible(10, 2, 3, 3));
    }

    @Test
    void riskScoreAddsSignalsAndCaps() {
        assertEquals(0, StickerRules.riskScore(new StickerRules.Signals(0, 1, 0, false)));
        assertEquals(40, StickerRules.riskScore(new StickerRules.Signals(1, 1, 0, false)));
        assertEquals(100, StickerRules.riskScore(new StickerRules.Signals(2, 3, 5, true)));
        assertEquals(4, StickerRules.riskReasons(new StickerRules.Signals(2, 3, 5, true)).size());
    }

    @Test
    void rarityIsCleanedAndLabelled() {
        assertEquals("rare", StickerRules.cleanRarity(" Rare "));
        assertNull(StickerRules.cleanRarity("legend"));
        assertEquals("Siêu hiếm", StickerRules.rarityLabel("epic"));
    }
}
