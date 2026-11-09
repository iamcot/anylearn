package com.anylearn.backend.service.farm;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class FarmGameRulesTest {

    private static final FarmGameRules.SocialLimits L = new FarmGameRules.SocialLimits(10, 15, 3, 3, 3);

    @Test
    void plotsAreBoughtInOrderWithALevelEach() {
        assertEquals(30, FarmGameRules.plotPrice(4));
        assertEquals(500, FarmGameRules.plotPrice(11));
        assertEquals(-1, FarmGameRules.plotPrice(12));
        assertEquals(2, FarmGameRules.plotLevel(4));
        assertEquals(20, FarmGameRules.plotLevel(11));
        assertEquals(99, FarmGameRules.plotLevel(12));
    }

    @Test
    void orderSlotsGrowWithLevel() {
        assertEquals(3, FarmGameRules.orderSlots(1));
        assertEquals(4, FarmGameRules.orderSlots(8));
        assertEquals(5, FarmGameRules.orderSlots(15));
    }

    @Test
    void newOrderIsDeterministicAndOnlyAsksForUnlockedCrops() {
        List<FarmGameRules.CropInfo> crops = List.of(new FarmGameRules.CropInfo("a", 2, 4, 4), new FarmGameRules.CropInfo("b", 3, 8, 4), new FarmGameRules.CropInfo("c", 6, 20, 4));
        for (long seed = 0; seed < 200; seed++) {
            FarmGameRules.Order o = FarmGameRules.newOrder(seed, crops, 110);
            assertEquals(o.items(), FarmGameRules.newOrder(seed, crops, 110).items());
            assertFalse(o.items().isEmpty());
            assertTrue(crops.stream().map(FarmGameRules.CropInfo::key).toList().containsAll(o.items().keySet()));
            int total = o.items().values().stream().mapToInt(Integer::intValue).sum();
            assertTrue(total >= 1 && total <= 12, "units " + total);
            assertTrue(o.items().values().stream().allMatch(q -> q >= 1));
            assertTrue(o.xp() > 0);
            assertTrue(o.coins() > 0);
        }
    }

    @Test
    void orderPaysCoinPercentOfBasePrice() {
        List<FarmGameRules.CropInfo> one = List.of(new FarmGameRules.CropInfo("a", 10, 4, 4));
        FarmGameRules.Order o = FarmGameRules.newOrder(5, one, 110);
        int units = o.items().get("a");
        assertEquals(Math.round(units * 10 * 1.1), o.coins());
    }

    @Test
    void dailyTasksAreStableForADayAndSkipHelpWithoutNeighbours() {
        LocalDate d = LocalDate.of(2026, 11, 9);
        List<FarmGameRules.TaskDef> a = FarmGameRules.tasksFor(7, d, false);
        assertEquals(a, FarmGameRules.tasksFor(7, d, false));
        assertEquals(3, a.size());
        assertEquals(3, a.stream().map(FarmGameRules.TaskDef::key).distinct().count());
        for (int i = 0; i < 300; i++) assertTrue(FarmGameRules.tasksFor(i, d.plusDays(i), false).stream().noneMatch(t -> t.kind().equals("help")));
    }

    @Test
    void chaptersOpenInOrderAndByLevel() {
        FarmGameRules.Chapter c1 = FarmGameRules.chapter(1);
        FarmGameRules.Chapter c3 = FarmGameRules.chapter(3);
        assertTrue(FarmGameRules.chapterOpen(c1, 1, false));
        assertFalse(FarmGameRules.chapterOpen(c3, 4, true));
        assertFalse(FarmGameRules.chapterOpen(c3, 5, false));
        assertTrue(FarmGameRules.chapterOpen(c3, 5, true));
        assertEquals(6, FarmGameRules.CHAPTERS.size());
        assertNull(FarmGameRules.chapter(9));
    }

    @Test
    void chapterRewardsAreSmallAndAddUpToTheBudget() {
        int total = FarmGameRules.CHAPTERS.stream().mapToInt(FarmGameRules.Chapter::coins).sum();
        assertEquals(450, total);
    }

    @Test
    void helpingStopsAtTheDailyLimits() {
        assertNull(FarmGameRules.helpProblem(0, 0, L));
        assertNotNull(FarmGameRules.helpProblem(10, 0, L));
        assertNotNull(FarmGameRules.helpProblem(0, 15, L));
    }

    @Test
    void flowerCanOnlyBePickedAfterTheGraceAndWithinTheLimits() {
        // stealable, ripe, 90 min after ripe (grace 60), none stolen yet, 5 units left, nothing picked today, both allow
        assertNull(FarmGameRules.stealProblem(true, true, 90, 60, 0, 5, 0, 0, true, true, false, L));
        assertNotNull(FarmGameRules.stealProblem(false, true, 90, 60, 0, 5, 0, 0, true, true, false, L), "vegetables cannot be picked");
        assertNotNull(FarmGameRules.stealProblem(true, false, 0, 60, 0, 5, 0, 0, true, true, false, L), "not ripe");
        assertNotNull(FarmGameRules.stealProblem(true, true, 30, 60, 0, 5, 0, 0, true, true, false, L), "owner still has time");
        assertNotNull(FarmGameRules.stealProblem(true, true, 90, 60, 1, 5, 0, 0, true, true, false, L), "one per plot");
        assertNotNull(FarmGameRules.stealProblem(true, true, 90, 60, 0, 3, 0, 0, true, true, false, L), "leave at least 3");
        assertNotNull(FarmGameRules.stealProblem(true, true, 90, 60, 0, 5, 3, 0, true, true, false, L), "daily limit of the thief");
        assertNotNull(FarmGameRules.stealProblem(true, true, 90, 60, 0, 5, 0, 3, true, true, false, L), "daily limit of the farm");
        assertNotNull(FarmGameRules.stealProblem(true, true, 90, 60, 0, 5, 0, 0, false, true, false, L), "owner switched it off");
        assertNotNull(FarmGameRules.stealProblem(true, true, 90, 60, 0, 5, 0, 0, true, false, false, L), "thief switched it off: no picking either");
        assertNotNull(FarmGameRules.stealProblem(true, true, 90, 60, 0, 5, 0, 0, true, true, true, L), "once per farm per day");
    }

    private static FarmGameRules.PushInput push(int ripe, int hour, long hoursSinceVisit, int ignored, long daysSincePush, boolean sentToday) {
        return new FarmGameRules.PushInput(8, ripe, 0, hour, 8, 20, hoursSinceVisit, ignored, daysSincePush, sentToday);
    }

    @Test
    void reminderOnlyWhenWorthItAndInTheHours() {
        assertTrue(FarmGameRules.shouldPush(push(5, 10, 6, 0, 1, false), 3, 7));
        assertFalse(FarmGameRules.shouldPush(push(2, 10, 6, 0, 1, false), 3, 7), "less than half ripe");
        assertFalse(FarmGameRules.shouldPush(push(5, 22, 6, 0, 1, false), 3, 7), "night");
        assertFalse(FarmGameRules.shouldPush(push(5, 7, 6, 0, 1, false), 3, 7), "too early");
        assertFalse(FarmGameRules.shouldPush(push(5, 10, 1, 0, 1, false), 3, 7), "was just there");
        assertFalse(FarmGameRules.shouldPush(push(5, 10, 6, 0, 1, true), 3, 7), "one a day");
    }

    @Test
    void reminderBacksOffThenStops() {
        assertFalse(FarmGameRules.shouldPush(push(5, 10, 30, 3, 1, false), 3, 7), "3 ignored: one every 3 days");
        assertTrue(FarmGameRules.shouldPush(push(5, 10, 30, 3, 3, false), 3, 7));
        assertFalse(FarmGameRules.shouldPush(push(5, 10, 300, 7, 30, false), 3, 7), "7 ignored: stop");
    }

    @Test
    void mainPathPaysThreeQuartersOfTheNextLevel() {
        List<FarmGameRules.PathStep> steps = FarmGameRules.pathFor(186, 75, "bap_rang", "Bắp rang nổ", true, 6);
        assertEquals(5, steps.size());
        assertEquals(140, steps.stream().mapToInt(FarmGameRules.PathStep::xp).sum());          // round(186 * 0.75)
        assertEquals("plots", steps.get(3).kind());
        assertEquals("fertilize", FarmGameRules.pathFor(186, 75, "bap_rang", "Bắp rang nổ", false, 6).get(3).kind());
        assertTrue(steps.stream().allMatch(s -> s.xp() >= 0));
    }

    @Test
    void thePathWorksAtTheSmallestLevel() {
        assertEquals(30, FarmGameRules.pathFor(40, 75, "rau_mam", "Rau mầm", false, 5).stream().mapToInt(FarmGameRules.PathStep::xp).sum());
    }

    @Test
    void challengesHaveUniqueKeysAndNeverPayLevelXp() {
        assertEquals(FarmGameRules.CHALLENGES.size(), FarmGameRules.CHALLENGES.stream().map(FarmGameRules.Challenge::key).distinct().count());
        assertNotNull(FarmGameRules.challenge("visit3"));
        assertNull(FarmGameRules.challenge("nope"));
    }
}
