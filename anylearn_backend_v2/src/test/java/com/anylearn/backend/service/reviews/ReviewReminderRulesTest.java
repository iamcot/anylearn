package com.anylearn.backend.service.reviews;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReviewReminderRulesTest {

    private static final LocalDate START = LocalDate.of(2026, 9, 1);
    private static final LocalDate END = LocalDate.of(2026, 9, 21);

    @Test
    void nothingBeforeHalfway() {
        assertEquals(Optional.empty(), ReviewReminderRules.dueStage(START, END, LocalDate.of(2026, 9, 10), Set.of()));
    }

    @Test
    void midReminderAtHalfwayOnce() {
        assertEquals(Optional.of("mid"), ReviewReminderRules.dueStage(START, END, LocalDate.of(2026, 9, 11), Set.of()));
        assertEquals(Optional.empty(), ReviewReminderRules.dueStage(START, END, LocalDate.of(2026, 9, 15), Set.of("mid")));
    }

    @Test
    void endReminderWhenOverAndSkipsMidAfterDowntime() {
        assertEquals(Optional.of("end"), ReviewReminderRules.dueStage(START, END, LocalDate.of(2026, 9, 21), Set.of("mid")));
        assertEquals(Optional.of("end"), ReviewReminderRules.dueStage(START, END, LocalDate.of(2026, 9, 22), Set.of()));
        assertEquals(Optional.empty(), ReviewReminderRules.dueStage(START, END, LocalDate.of(2026, 9, 22), Set.of("end")));
    }

    @Test
    void oldCoursesAreLeftAlone() {
        assertEquals(Optional.empty(), ReviewReminderRules.dueStage(START, END, END.plusDays(15), Set.of()));
        assertEquals(Optional.of("end"), ReviewReminderRules.dueStage(START, END, END.plusDays(14), Set.of()));
    }

    @Test
    void courseWithoutEndDateEndsThirtyDaysAfterStart() {
        assertEquals(START.plusDays(30), ReviewReminderRules.endOf(START, null));
        assertEquals(Optional.of("mid"), ReviewReminderRules.dueStage(START, null, START.plusDays(15), Set.of()));
        assertEquals(Optional.of("end"), ReviewReminderRules.dueStage(START, null, START.plusDays(30), Set.of()));
    }

    @Test
    void oneDayCourseHasNoMidReminder() {
        assertEquals(Optional.empty(), ReviewReminderRules.dueStage(START, START, START.minusDays(1), Set.of()));
        assertEquals(Optional.of("end"), ReviewReminderRules.dueStage(START, START, START, Set.of()));
    }
}
