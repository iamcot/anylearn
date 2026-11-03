package com.anylearn.backend.service.today;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class FlexibleStartRulesTest {

    // 2026-11-03 is a Tuesday
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 3);

    private static ScheduleSlot slot(String weekdays, LocalDate from, LocalDate to) {
        return ScheduleSlot.of(1L, "open", null, weekdays, "18:00", "19:30", from, to);
    }

    @Test
    void suggestsTheNextThreeClassDaysFromTomorrow() {
        assertThat(FlexibleStartRules.suggestions(slot("tue,thu,sat", null, null), TODAY, 3))
                .containsExactly(LocalDate.of(2026, 11, 5), LocalDate.of(2026, 11, 7), LocalDate.of(2026, 11, 10));
    }

    @Test
    void aClassWithoutWeekdaysMeetsAnyDay() {
        assertThat(FlexibleStartRules.suggestions(slot(null, null, null), TODAY, 3))
                .containsExactly(LocalDate.of(2026, 11, 4), LocalDate.of(2026, 11, 5), LocalDate.of(2026, 11, 6));
    }

    @Test
    void suggestionsStopWhenTheClassEnds() {
        assertThat(FlexibleStartRules.suggestions(slot("sat", null, LocalDate.of(2026, 11, 10)), TODAY, 3))
                .containsExactly(LocalDate.of(2026, 11, 7));
    }

    @Test
    void suggestionsWaitForTheClassOwnStart() {
        assertThat(FlexibleStartRules.suggestions(slot("mon", LocalDate.of(2026, 12, 1), null), TODAY, 1))
                .containsExactly(LocalDate.of(2026, 12, 7));
    }

    @Test
    void aPickedDayMovesToTheFirstClassDayOnOrAfterIt() {
        ScheduleSlot s = slot("mon,wed", null, null);
        assertThat(FlexibleStartRules.resolve(s, LocalDate.of(2026, 11, 20), TODAY)).contains(LocalDate.of(2026, 11, 23));
        assertThat(FlexibleStartRules.resolve(s, LocalDate.of(2026, 11, 25), TODAY)).contains(LocalDate.of(2026, 11, 25));
    }

    @Test
    void aPastOrTodayPickStartsFromTomorrow() {
        ScheduleSlot s = slot("tue,wed", null, null);
        assertThat(FlexibleStartRules.resolve(s, TODAY, TODAY)).contains(LocalDate.of(2026, 11, 4));
        assertThat(FlexibleStartRules.resolve(s, TODAY.minusDays(10), TODAY)).contains(LocalDate.of(2026, 11, 4));
    }

    @Test
    void aPickAfterTheClassEndsHasNoStart() {
        assertThat(FlexibleStartRules.resolve(slot("mon", null, LocalDate.of(2026, 11, 30)), LocalDate.of(2026, 12, 1), TODAY)).isEmpty();
    }

    @Test
    void theAccountPageChangesTheStartOnceBeforeTheClassStarts() {
        assertThat(FlexibleStartRules.canChangeFromAccount(null, null, TODAY)).isTrue();
        assertThat(FlexibleStartRules.canChangeFromAccount(TODAY.plusDays(2), null, TODAY)).isTrue();
        assertThat(FlexibleStartRules.canChangeFromAccount(TODAY, null, TODAY)).isFalse();
        assertThat(FlexibleStartRules.canChangeFromAccount(TODAY.plusDays(2), LocalDateTime.now(), TODAY)).isFalse();
    }

    @Test
    void endDateCountsClassDaysOrThePeriod() {
        ScheduleSlot s = slot("tue,thu", null, null);
        LocalDate start = LocalDate.of(2026, 11, 5);
        assertThat(FlexibleStartRules.endDate(s, start, "session", 4)).isEqualTo(LocalDate.of(2026, 11, 17));
        assertThat(FlexibleStartRules.endDate(s, start, "month", 1)).isEqualTo(LocalDate.of(2026, 12, 4));
        assertThat(FlexibleStartRules.endDate(s, start, null, null)).isNull();
    }
}
