package com.anylearn.backend.service.lifecycle;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LifecycleRulesTest {

    private static final List<Integer> STEPS = List.of(3, 1);

    @Test
    void parsesDaysBiggestFirstAndDropsJunk() {
        assertEquals(List.of(3, 1), LifecycleRules.parseDays("1, 3, abc, 0, -2", List.of(9)));
        assertEquals(List.of(9), LifecycleRules.parseDays("", List.of(9)));
        assertEquals(List.of(9), LifecycleRules.parseDays(null, List.of(9)));
    }

    @Test
    void numberOutsideRangeFallsBack() {
        assertEquals(5, LifecycleRules.intOr("5", 2, 1, 10));
        assertEquals(2, LifecycleRules.intOr("50", 2, 1, 10));
        assertEquals(2, LifecycleRules.intOr("x", 2, 1, 10));
    }

    @Test
    void dueStepIsTheSmallestOneStillAhead() {
        assertTrue(LifecycleRules.dueDay(5, STEPS).isEmpty());
        assertEquals(3, LifecycleRules.dueDay(3, STEPS).getAsInt());
        assertEquals(3, LifecycleRules.dueDay(2, STEPS).getAsInt());
        assertEquals(1, LifecycleRules.dueDay(1, STEPS).getAsInt());
        assertEquals(1, LifecycleRules.dueDay(0, STEPS).getAsInt());
        assertTrue(LifecycleRules.dueDay(-1, STEPS).isEmpty());
    }

    @Test
    void surveyIsDueAtHalfOfTheSessionsButNotWhenFinished() {
        assertFalse(LifecycleRules.surveyDue(3, 8, 50));
        assertTrue(LifecycleRules.surveyDue(4, 8, 50));
        assertTrue(LifecycleRules.surveyDue(5, 8, 50));
        assertFalse(LifecycleRules.surveyDue(8, 8, 50));
        assertFalse(LifecycleRules.surveyDue(1, 1, 50));
        assertTrue(LifecycleRules.surveyDue(3, 12, 25));
    }

    @Test
    void countsOnlyTheMissesAtTheEnd() {
        assertEquals(0, LifecycleRules.trailingMisses(List.of()));
        assertEquals(0, LifecycleRules.trailingMisses(List.of(false, true)));
        assertEquals(2, LifecycleRules.trailingMisses(List.of(true, false, false)));
        assertEquals(1, LifecycleRules.trailingMisses(List.of(false, true, false)));
    }

    @Test
    void fullAttendanceNeedsTheWholeCourseOverAndEverySessionAttended() {
        assertTrue(LifecycleRules.fullAttendance(List.of(true, true, true), 3));
        assertFalse(LifecycleRules.fullAttendance(List.of(true, true), 3));            // the course is not over yet
        assertFalse(LifecycleRules.fullAttendance(List.of(true, false, true), 3));     // a session was missed
        assertTrue(LifecycleRules.fullAttendance(List.of(true, true, true, false), 3)); // extra sessions after the course do not count
        assertFalse(LifecycleRules.fullAttendance(List.of(), 0));
    }

    @Test
    void sendingWindowIncludesStartExcludesEnd() {
        assertTrue(LifecycleRules.inWindow(8, 8, 21));
        assertTrue(LifecycleRules.inWindow(20, 8, 21));
        assertFalse(LifecycleRules.inWindow(21, 8, 21));
        assertFalse(LifecycleRules.inWindow(3, 8, 21));
    }

    @Test
    void earlyRenewalNeedsSessionsLeftOrAPeriodThatStillRuns() {
        LocalDate today = LocalDate.of(2026, 10, 20);
        assertTrue(LifecycleRules.isEarlyRenewal(true, 2, null, today));
        assertFalse(LifecycleRules.isEarlyRenewal(true, 0, today.plusDays(5), today));
        assertTrue(LifecycleRules.isEarlyRenewal(false, 0, today, today));
        assertFalse(LifecycleRules.isEarlyRenewal(false, 0, today.minusDays(1), today));
        assertFalse(LifecycleRules.isEarlyRenewal(false, 0, null, today));
    }

    @Test
    void scoreAndSettingChecks() {
        assertTrue(LifecycleRules.validScore(1));
        assertTrue(LifecycleRules.validScore(5));
        assertFalse(LifecycleRules.validScore(0));
        assertFalse(LifecycleRules.validScore(6));
        assertFalse(LifecycleRules.validScore(null));
        assertTrue(LifecycleRules.isLow(2, 2));
        assertFalse(LifecycleRules.isLow(3, 2));
        assertNull(LifecycleRules.rangeProblem(5, 1, 10, "x"));
        assertNotNull(LifecycleRules.rangeProblem(11, 1, 10, "x"));
        assertNotNull(LifecycleRules.rangeProblem(null, 1, 10, "x"));
        assertNull(LifecycleRules.daysProblem(List.of(3, 1), "x"));
        assertNotNull(LifecycleRules.daysProblem(List.of(), "x"));
        assertNotNull(LifecycleRules.daysProblem(java.util.Arrays.asList(3, null), "x"));
        assertNotNull(LifecycleRules.daysProblem(List.of(400), "x"));
    }
}
