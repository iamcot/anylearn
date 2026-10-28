package com.anylearn.backend.service.quiz;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;

class QuizProgressTest {

    private final List<Integer> stars = QuizProgress.DEFAULT_STARS;

    @Test
    void rightAnswerAddsAStar() {
        var r = QuizProgress.apply(stars, new QuizProgress.State(0, 2, 1), true, 1, false);
        assertEquals(new QuizProgress.State(0, 3, 1), r.after());
        assertFalse(r.rankedUp());
    }

    @Test
    void luckyStarsCountOnlyWhenRight() {
        assertEquals(4, QuizProgress.apply(stars, new QuizProgress.State(0, 1, 1), true, 3, false).after().stars());
        var wrong = QuizProgress.apply(stars, new QuizProgress.State(0, 1, 1), false, 3, false);
        assertEquals(0, wrong.after().stars());
    }

    @Test
    void enoughStarsRankUpAndKeepTheExtra() {
        var r = QuizProgress.apply(stars, new QuizProgress.State(0, 4, 0), true, 3, false);
        assertTrue(r.rankedUp());
        assertEquals(new QuizProgress.State(1, 2, 1), r.after());
    }

    @Test
    void severalRanksCanBeClimbedAtOnce() {
        var r = QuizProgress.apply(stars, new QuizProgress.State(0, 4, 1), true, 3, false);
        assertEquals(1, r.after().rank());
        var big = QuizProgress.apply(List.of(1, 1, 1), new QuizProgress.State(0, 0, 1), true, 3, false);
        assertEquals(3, big.after().rank());
    }

    @Test
    void topRankOnlyGathersStars() {
        var r = QuizProgress.apply(stars, new QuizProgress.State(7, 40, 1), true, 2, false);
        assertEquals(new QuizProgress.State(7, 42, 1), r.after());
        assertFalse(r.rankedUp());
    }

    @Test
    void wrongAnswerTakesAStar() {
        var r = QuizProgress.apply(stars, new QuizProgress.State(2, 3, 1), false, 1, false);
        assertEquals(2, r.after().stars());
    }

    @Test
    void shieldKeepsEverything() {
        var before = new QuizProgress.State(2, 0, 0);
        var r = QuizProgress.apply(stars, before, false, 1, true);
        assertEquals(before, r.after());
        assertTrue(r.shieldUsed());
    }

    @Test
    void guardAbsorbsTheFirstMissAtZeroStars() {
        var r = QuizProgress.apply(stars, new QuizProgress.State(2, 0, 1), false, 1, false);
        assertEquals(new QuizProgress.State(2, 0, 0), r.after());
        assertTrue(r.guardLost());
    }

    @Test
    void secondMissDropsTheRankWithMaxMinusOneStarsAndGuard() {
        var r = QuizProgress.apply(stars, new QuizProgress.State(2, 0, 0), false, 1, false);
        assertTrue(r.rankedDown());
        assertEquals(new QuizProgress.State(1, 5, 1), r.after());
    }

    @Test
    void lowestRankNeverDrops() {
        var before = new QuizProgress.State(0, 0, 0);
        assertEquals(before, QuizProgress.apply(stars, before, false, 1, false).after());
    }

    @Test
    void aStarBringsTheGuardBack() {
        var r = QuizProgress.apply(stars, new QuizProgress.State(1, 0, 0), true, 1, false);
        assertEquals(1, r.after().guard());
    }

    @Test
    void parseStarsFallsBackWhenUnusable() {
        assertEquals(QuizProgress.DEFAULT_STARS, QuizProgress.parseStars("1,2,3"));
        assertEquals(QuizProgress.DEFAULT_STARS, QuizProgress.parseStars("a,b"));
        assertEquals(List.of(1, 2, 3, 4, 5, 6, 7), QuizProgress.parseStars("1,2,3,4,5,6,7"));
    }

    @Test
    void dropChanceGrowsWithPityAndIsCertainAtTheLimit() {
        assertEquals(0.12, QuizItems.dropChance(0.12, 0.04, 0, 12, false, 0.08), 1e-9);
        assertEquals(0.20, QuizItems.dropChance(0.12, 0.04, 2, 12, false, 0.08), 1e-9);
        assertEquals(0.28, QuizItems.dropChance(0.12, 0.04, 2, 12, true, 0.08), 1e-9);
        assertEquals(1.0, QuizItems.dropChance(0.12, 0.04, 12, 12, false, 0.08), 1e-9);
    }

    @Test
    void streakGiftEveryThird() {
        assertFalse(QuizItems.streakGift(2, 3));
        assertTrue(QuizItems.streakGift(3, 3));
        assertTrue(QuizItems.streakGift(9, 3));
        assertFalse(QuizItems.streakGift(0, 3));
    }

    @Test
    void pickSkipsItemsAtTheirCap() {
        Map<String, Integer> weights = Map.of(QuizItems.FIFTY, 50, QuizItems.TIME, 50);
        assertEquals(QuizItems.TIME, QuizItems.pick(weights, List.of(QuizItems.FIFTY, QuizItems.TIME), Map.of(QuizItems.FIFTY, 10), 0.0));
        assertNull(QuizItems.pick(weights, List.of(QuizItems.FIFTY), Map.of(QuizItems.FIFTY, 10), 0.5));
    }

    @Test
    void pickFollowsTheRoll() {
        Map<String, Integer> weights = Map.of(QuizItems.FIFTY, 25, QuizItems.COMMUNITY, 75);
        List<String> both = List.of(QuizItems.FIFTY, QuizItems.COMMUNITY);
        assertEquals(QuizItems.FIFTY, QuizItems.pick(weights, both, Map.of(), 0.1));
        assertEquals(QuizItems.COMMUNITY, QuizItems.pick(weights, both, Map.of(), 0.9));
    }

    @Test
    void votesAddUpToOneHundredAndFavourTheRightOption() {
        for (int d = 1; d <= 5; d++) {
            int[] v = QuizItems.simulatedVotes(2, d, new Random(d));
            assertEquals(100, v[0] + v[1] + v[2] + v[3]);
            assertTrue(v[2] >= 30);
        }
        int[] real = QuizItems.realVotes(new int[]{10, 10, 5, 5}, 30);
        assertEquals(100, real[0] + real[1] + real[2] + real[3]);
        assertNull(QuizItems.realVotes(new int[]{1, 1, 1, 1}, 30));
    }
}
