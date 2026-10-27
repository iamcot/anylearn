package com.anylearn.backend.service.recommend;

import com.anylearn.backend.service.recommend.RecommendationRules.Candidate;
import com.anylearn.backend.service.recommend.RecommendationRules.Slot;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RecommendationRulesTest {

    private static Slot slot(DayOfWeek day, String start, String end) {
        return new Slot(day, LocalTime.parse(start), LocalTime.parse(end));
    }

    private static Candidate candidate(long id, int score, Integer min, Integer max, List<List<Slot>> options) {
        return new Candidate(id, RecommendationRules.SIBLING, "x", "text", score, min, max, options);
    }

    @Test
    void slotsOverlapOnlyOnTheSameDayAndWhenTimesCross() {
        assertTrue(RecommendationRules.overlaps(slot(DayOfWeek.MONDAY, "17:00", "18:30"), slot(DayOfWeek.MONDAY, "18:00", "19:00")));
        assertFalse(RecommendationRules.overlaps(slot(DayOfWeek.MONDAY, "17:00", "18:00"), slot(DayOfWeek.MONDAY, "18:00", "19:00")));
        assertFalse(RecommendationRules.overlaps(slot(DayOfWeek.MONDAY, "17:00", "18:30"), slot(DayOfWeek.TUESDAY, "17:00", "18:30")));
        assertFalse(RecommendationRules.overlaps(new Slot(DayOfWeek.MONDAY, null, null), slot(DayOfWeek.MONDAY, "17:00", "18:30")));
    }

    @Test
    void freeDaysAreTheDaysWithoutAnyClass() {
        List<Slot> busy = List.of(slot(DayOfWeek.MONDAY, "17:00", "18:00"), new Slot(DayOfWeek.WEDNESDAY, null, null));
        List<DayOfWeek> free = RecommendationRules.freeDays(busy);
        assertFalse(free.contains(DayOfWeek.MONDAY));
        assertFalse(free.contains(DayOfWeek.WEDNESDAY));
        assertTrue(free.contains(DayOfWeek.TUESDAY));
        assertEquals(5, free.size());
    }

    @Test
    void ageFilterUsesTheLearnersPossibleAges() {
        assertTrue(RecommendationRules.ageFits(new int[]{8, 9}, 9, 12));
        assertFalse(RecommendationRules.ageFits(new int[]{7, 8}, 9, 12));
        assertFalse(RecommendationRules.ageFits(new int[]{13, 13}, 9, 12));
        assertTrue(RecommendationRules.ageFits(new int[]{13, 13}, null, null));
        assertTrue(RecommendationRules.ageFits(null, 9, 12));
    }

    @Test
    void eligibleDropsOwnedDismissedWrongAgeAndClashingCourses() {
        int[] age = {9, 9};
        List<Slot> busy = List.of(slot(DayOfWeek.MONDAY, "17:00", "18:30"));
        List<List<Slot>> clash = List.of(List.of(slot(DayOfWeek.MONDAY, "18:00", "19:00")));
        List<List<Slot>> free = List.of(List.of(slot(DayOfWeek.TUESDAY, "18:00", "19:00")));

        assertTrue(RecommendationRules.eligible(candidate(1, 10, 6, 12, free), age, Set.of(), Set.of(), busy).isPresent());
        assertTrue(RecommendationRules.eligible(candidate(1, 10, 6, 12, free), age, Set.of(1L), Set.of(), busy).isEmpty());
        assertTrue(RecommendationRules.eligible(candidate(1, 10, 6, 12, free), age, Set.of(), Set.of(1L), busy).isEmpty());
        assertTrue(RecommendationRules.eligible(candidate(1, 10, 12, 15, free), age, Set.of(), Set.of(), busy).isEmpty());
        assertTrue(RecommendationRules.eligible(candidate(1, 10, 6, 12, clash), age, Set.of(), Set.of(), busy).isEmpty());
    }

    @Test
    void aCourseWithTwoClassesKeepsOnlyTheOneThatFits() {
        List<List<Slot>> options = List.of(List.of(slot(DayOfWeek.MONDAY, "18:00", "19:00")), List.of(slot(DayOfWeek.FRIDAY, "18:00", "19:00")));
        var result = RecommendationRules.eligible(candidate(1, 10, null, null, options), new int[]{9, 9}, Set.of(), Set.of(),
                List.of(slot(DayOfWeek.MONDAY, "17:30", "19:00"))).orElseThrow();
        assertEquals(1, result.options().size());
        assertEquals(DayOfWeek.FRIDAY, result.options().get(0).get(0).day());
    }

    @Test
    void aCourseWithoutClassTimesAlwaysFitsTheWeek() {
        assertTrue(RecommendationRules.eligible(candidate(1, 10, null, null, List.of()), new int[]{9, 9}, Set.of(), Set.of(),
                List.of(slot(DayOfWeek.MONDAY, "17:00", "18:00"))).isPresent());
    }

    @Test
    void nextStepSkipsStepsTheLearnerAlreadyHas() {
        List<Long> steps = List.of(10L, 11L, 12L);
        assertEquals(11L, RecommendationRules.nextStep(steps, 10L, Set.of(10L)).orElseThrow());
        assertEquals(12L, RecommendationRules.nextStep(steps, 10L, Set.of(10L, 11L)).orElseThrow());
        assertTrue(RecommendationRules.nextStep(steps, 12L, Set.of(12L)).isEmpty());
        assertTrue(RecommendationRules.nextStep(steps, 99L, Set.of()).isEmpty());
        assertEquals(2, RecommendationRules.doneSteps(steps, Set.of(10L, 12L, 77L)));
    }

    @Test
    void rankKeepsTheBestScorePerCourseAndOrdersByScore() {
        List<Candidate> ranked = RecommendationRules.rank(List.of(
                candidate(1, 40, null, null, List.of()), candidate(2, 100, null, null, List.of()),
                candidate(1, 70, null, null, List.of()), candidate(3, 50, null, null, List.of())), 2);
        assertEquals(List.of(2L, 1L), ranked.stream().map(Candidate::itemId).toList());
        assertEquals(70, ranked.get(1).score());
        assertTrue(RecommendationRules.rank(List.of(), 3).isEmpty());
    }

    @Test
    void sourcesParseAndUnknownOnesAreDropped() {
        assertEquals(RecommendationRules.SOURCES, RecommendationRules.parseSources(null));
        assertEquals(List.of("pathway", "season"), RecommendationRules.parseSources("pathway, season, bogus, pathway"));
        assertTrue(RecommendationRules.validSource("sibling"));
        assertFalse(RecommendationRules.validSource("bogus"));
        assertTrue(RecommendationRules.validEvent("click"));
        assertFalse(RecommendationRules.validEvent("buy"));
    }

    @Test
    void dismissLastsTheConfiguredDays() {
        LocalDateTime now = LocalDateTime.of(2026, 10, 27, 9, 0);
        assertEquals(now.plusDays(30), RecommendationRules.dismissedUntil(now, 30));
    }

    @Test
    void weekdaysAndTimesAreParsed() {
        assertEquals(List.of(DayOfWeek.MONDAY, DayOfWeek.SATURDAY), RecommendationRules.parseDays("Mon, sat, xyz, mon"));
        assertEquals(LocalTime.of(17, 30), RecommendationRules.parseTime("17:30"));
        assertEquals(LocalTime.of(17, 30), RecommendationRules.parseTime("17:30:00"));
        assertEquals(null, RecommendationRules.parseTime("chiều"));
        assertEquals(2, RecommendationRules.slotsOf("mon,wed", "17:00", "18:00").size());
        assertEquals("Thứ 4", RecommendationRules.dayLabel(DayOfWeek.WEDNESDAY));
        assertEquals("Chủ nhật", RecommendationRules.dayLabel(DayOfWeek.SUNDAY));
    }
}
