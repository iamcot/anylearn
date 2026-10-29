package com.anylearn.backend.service.arena;

import com.anylearn.backend.service.arena.ArenaRules.Entry;
import com.anylearn.backend.service.arena.ArenaRules.Kind;
import com.anylearn.backend.service.arena.ArenaRules.Slot;
import com.anylearn.backend.service.arena.ArenaRules.Timing;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class ArenaRulesTest {

    private static final LocalDateTime START = LocalDateTime.of(2026, 10, 29, 20, 0);

    /** 20:00 start, 10 min room, 3 questions, countdown 10, answer 15, reveal 5, gap 60. */
    private static Timing timing() {
        return new Timing(START, START.minusMinutes(10), 3, 10, 15, 5, 60);
    }

    @Test
    void questionTimesFollowTheGap() {
        assertEquals(START, ArenaRules.questionAt(timing(), 1));
        assertEquals(START.plusSeconds(120), ArenaRules.questionAt(timing(), 3));
        assertEquals(START.plusSeconds(15), ArenaRules.answerEndsAt(timing(), 1));
        assertEquals(START.plusSeconds(120 + 15 + 5), ArenaRules.endsAt(timing()));
    }

    @Test
    void phaseAtEveryLandmark() {
        Timing t = timing();
        assertEquals(Kind.BEFORE, ArenaRules.phaseAt(t, START.minusMinutes(11)).kind());
        assertEquals(Kind.OPEN, ArenaRules.phaseAt(t, START.minusMinutes(10)).kind());
        assertEquals(Kind.OPEN, ArenaRules.phaseAt(t, START.minusSeconds(11)).kind());
        ArenaRules.Phase countdown = ArenaRules.phaseAt(t, START.minusSeconds(10));
        assertEquals(Kind.COUNTDOWN, countdown.kind());
        assertEquals(1, countdown.qNo());
        assertEquals(10_000, countdown.millisToNext());
        assertEquals(Kind.QUESTION, ArenaRules.phaseAt(t, START).kind());
        assertEquals(Kind.QUESTION, ArenaRules.phaseAt(t, START.plusSeconds(14)).kind());
        assertEquals(Kind.REVEAL, ArenaRules.phaseAt(t, START.plusSeconds(15)).kind());
        assertEquals(Kind.REVEAL, ArenaRules.phaseAt(t, START.plusSeconds(19)).kind());
        ArenaRules.Phase lobby = ArenaRules.phaseAt(t, START.plusSeconds(20));
        assertEquals(Kind.LOBBY, lobby.kind());
        assertEquals(1, lobby.qNo());
        assertEquals(2, lobby.nextQNo());
        assertEquals(40_000, lobby.millisToNext());
        // the countdown of question 2 starts 10 s before it
        assertEquals(Kind.COUNTDOWN, ArenaRules.phaseAt(t, START.plusSeconds(50)).kind());
        assertEquals(2, ArenaRules.phaseAt(t, START.plusSeconds(50)).qNo());
        assertEquals(Kind.QUESTION, ArenaRules.phaseAt(t, START.plusSeconds(60)).kind());
        assertEquals(Kind.ENDED, ArenaRules.phaseAt(t, START.plusSeconds(140)).kind());
        assertEquals(Kind.REVEAL, ArenaRules.phaseAt(t, START.plusSeconds(139)).kind());
    }

    @Test
    void theLastQuestionHasNoNext() {
        ArenaRules.Phase p = ArenaRules.phaseAt(timing(), START.plusSeconds(125));
        assertEquals(Kind.QUESTION, p.kind());
        assertEquals(3, p.qNo());
        assertEquals(0, p.nextQNo());
    }

    @Test
    void rankingByScoreThenTimeThenWhoCameFirst() {
        List<Entry> list = new ArrayList<>(List.of(
                new Entry(1, 5, 9000, 100), new Entry(2, 6, 20000, 100), new Entry(3, 5, 8000, 200), new Entry(4, 5, 8000, 150)));
        list.sort(ArenaRules.ranking());
        assertEquals(List.of(2L, 4L, 3L, 1L), list.stream().map(Entry::userId).toList());
    }

    @Test
    void lateAnswersGetTwoSecondsOfGrace() {
        Timing t = timing();
        assertFalse(ArenaRules.late(START.plusSeconds(17), t, 1));
        assertTrue(ArenaRules.late(START.plusSeconds(18), t, 1));
    }

    @Test
    void flags() {
        assertNotNull(ArenaRules.flagReason(400, true, false, 1000, true));
        assertNull(ArenaRules.flagReason(400, false, false, 1000, true));
        assertNull(ArenaRules.flagReason(400, true, false, 0, true));
        assertNotNull(ArenaRules.flagReason(5000, true, true, 1000, true));
        assertNull(ArenaRules.flagReason(5000, true, true, 1000, false));
    }

    @Test
    void rewards() {
        List<Integer> coins = List.of(300, 200, 100);
        assertEquals(300, ArenaRules.rewardFor(1, 10, 20, coins, 3, 20));
        assertEquals(100, ArenaRules.rewardFor(3, 4, 20, coins, 3, 20));
        // top 3 below the minimum score only get the participation reward
        assertEquals(20, ArenaRules.rewardFor(2, 2, 20, coins, 3, 20));
        // outside the top 3
        assertEquals(20, ArenaRules.rewardFor(27, 9, 20, coins, 3, 20));
        // never answered
        assertEquals(0, ArenaRules.rewardFor(40, 0, 0, coins, 3, 20));
        // participation switched off
        assertEquals(0, ArenaRules.rewardFor(27, 9, 20, coins, 3, 0));
        assertTrue(ArenaRules.topPrize(3, 3, 3, coins));
        assertFalse(ArenaRules.topPrize(4, 9, 3, coins));
        assertFalse(ArenaRules.topPrize(1, 5, 3, List.of(0, 200, 100)));
    }

    @Test
    void evenPlanSplitsLevelsEvenlyAndRises() {
        List<Slot> plan = ArenaRules.evenPlan(20, List.of(1, 2, 3, 4, 5), List.of("a", "b", "c", "d", "e", "f", "g", "h"), 0);
        assertEquals(20, plan.size());
        Map<Integer, Integer> perLevel = new HashMap<>();
        plan.forEach(s -> perLevel.merge(s.level(), 1, Integer::sum));
        perLevel.values().forEach(n -> assertEquals(4, n));
        for (int i = 1; i < plan.size(); i++) assertTrue(plan.get(i).level() >= plan.get(i - 1).level());
    }

    @Test
    void evenPlanGivesTheRemainderToTheLowestLevels() {
        List<Slot> plan = ArenaRules.evenPlan(22, List.of(1, 2, 3, 4, 5), List.of("a", "b"), 0);
        Map<Integer, Integer> perLevel = new HashMap<>();
        plan.forEach(s -> perLevel.merge(s.level(), 1, Integer::sum));
        assertEquals(List.of(5, 5, 4, 4, 4), List.of(perLevel.get(1), perLevel.get(2), perLevel.get(3), perLevel.get(4), perLevel.get(5)));
    }

    @Test
    void evenPlanTopicsDifferByOneAndNeighboursDiffer() {
        List<String> topics = List.of("a", "b", "c", "d", "e", "f", "g", "h");
        List<Slot> plan = ArenaRules.evenPlan(20, List.of(1, 2, 3, 4, 5), topics, 3);
        Map<String, Integer> per = new HashMap<>();
        plan.forEach(s -> per.merge(s.topic(), 1, Integer::sum));
        int min = per.values().stream().min(Integer::compare).get();
        int max = per.values().stream().max(Integer::compare).get();
        assertTrue(max - min <= 1);
        for (int i = 1; i < plan.size(); i++) assertNotEquals(plan.get(i).topic(), plan.get(i - 1).topic());
        // a different day starts on a different topic
        assertNotEquals(plan.get(0).topic(), ArenaRules.evenPlan(20, List.of(1, 2, 3, 4, 5), topics, 4).get(0).topic());
    }

    @Test
    void evenPlanHandlesNoTopicsAndNoLevels() {
        assertNull(ArenaRules.evenPlan(5, List.of(1), List.of(), 0).get(0).topic());
        assertTrue(ArenaRules.evenPlan(5, List.of(), List.of("a"), 0).isEmpty());
    }

    @Test
    void validateChecksThePaceAndTheSchedule() {
        Set<DayOfWeek> days = Set.of(DayOfWeek.MONDAY);
        assertNull(ArenaRules.validate(10, 15, 5, 60, List.of(1), "20:00", days));
        assertNotNull(ArenaRules.validate(10, 15, 5, 39, List.of(1), "20:00", days));
        assertNull(ArenaRules.validate(10, 15, 5, 40, List.of(1), "20:00", days));
        assertNotNull(ArenaRules.validate(10, 15, 5, 60, List.of(), "20:00", days));
        assertNotNull(ArenaRules.validate(10, 15, 5, 60, List.of(1), "25:00", days));
        assertNotNull(ArenaRules.validate(10, 15, 5, 60, List.of(1), "20:00", Set.of()));
    }

    @Test
    void nextRunDay() {
        Set<DayOfWeek> days = ArenaRules.parseDays("1,3");
        // 2026-10-29 is a Thursday
        assertEquals(LocalDate.of(2026, 11, 2), ArenaRules.nextRunDay(LocalDate.of(2026, 10, 29), days));
        assertEquals(LocalDate.of(2026, 10, 28), ArenaRules.nextRunDay(LocalDate.of(2026, 10, 28), days));
        assertNull(ArenaRules.nextRunDay(LocalDate.of(2026, 10, 29), Set.of()));
    }

    @Test
    void parsing() {
        assertEquals(List.of(1, 2), ArenaRules.parseInts("1, 2, x, 9, 2", 1, 5));
        assertEquals(List.of("a", "b"), ArenaRules.parseWords("a, b a"));
        assertNotNull(ArenaRules.parseTime("8:05"));
        assertNull(ArenaRules.parseTime("24:00"));
    }
}
