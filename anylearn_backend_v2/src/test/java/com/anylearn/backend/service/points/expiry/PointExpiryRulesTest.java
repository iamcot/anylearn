package com.anylearn.backend.service.points.expiry;

import com.anylearn.backend.service.points.expiry.PointExpiryRules.Lot;
import com.anylearn.backend.service.points.expiry.PointExpiryRules.Take;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PointExpiryRulesTest {

    private static final LocalDate START = LocalDate.of(2027, 1, 1);

    @Test
    void pointsEarnedBeforeTheStartDayCountFromTheStartDay() {
        assertThat(PointExpiryRules.expiresOn(LocalDate.of(2026, 10, 27), START, 12)).isEqualTo(LocalDate.of(2028, 1, 1));
        assertThat(PointExpiryRules.lastUsableDay(LocalDate.of(2020, 5, 5), START, 12)).isEqualTo(LocalDate.of(2027, 12, 31));
    }

    @Test
    void pointsEarnedAfterTheStartDayCountFromTheEarnedDay() {
        assertThat(PointExpiryRules.expiresOn(LocalDate.of(2027, 3, 15), START, 12)).isEqualTo(LocalDate.of(2028, 3, 15));
        assertThat(PointExpiryRules.expiresOn(LocalDate.of(2027, 1, 1), START, 12)).isEqualTo(LocalDate.of(2028, 1, 1));
    }

    @Test
    void nothingExpiresBeforeTheFirstExpiryDay() {
        LocalDate earned = LocalDate.of(2026, 10, 1);
        assertThat(PointExpiryRules.isExpired(earned, START, 12, LocalDate.of(2027, 12, 31))).isFalse();
        assertThat(PointExpiryRules.isExpired(earned, START, 12, LocalDate.of(2028, 1, 1))).isTrue();
        assertThat(PointExpiryRules.isExpired(earned, START, 12, LocalDate.of(2026, 10, 27))).isFalse();
    }

    @Test
    void monthEndIsClampedByTheCalendar() {
        assertThat(PointExpiryRules.expiresOn(LocalDate.of(2027, 2, 28), START, 12)).isEqualTo(LocalDate.of(2028, 2, 28));
        assertThat(PointExpiryRules.expiresOn(LocalDate.of(2027, 8, 31), START, 6)).isEqualTo(LocalDate.of(2028, 2, 29));
    }

    @Test
    void spendingTakesTheOldestLotFirst() {
        List<Lot> lots = List.of(new Lot(2, 50, LocalDate.of(2027, 6, 1)), new Lot(1, 30, LocalDate.of(2027, 1, 5)), new Lot(3, 0, LocalDate.of(2026, 1, 1)));
        assertThat(PointExpiryRules.allocate(lots, 60)).containsExactly(new Take(1, 30), new Take(2, 30));
    }

    @Test
    void spendingMoreThanTheLotsHoldTakesEverything() {
        List<Lot> lots = List.of(new Lot(1, 10, LocalDate.of(2027, 1, 5)), new Lot(2, 5, LocalDate.of(2027, 2, 5)));
        assertThat(PointExpiryRules.allocate(lots, 100)).containsExactly(new Take(1, 10), new Take(2, 5));
        assertThat(PointExpiryRules.allocate(lots, 0)).isEmpty();
        assertThat(PointExpiryRules.allocate(List.of(), 5)).isEmpty();
    }

    @Test
    void lotsOfTheSameDayAreSpentInIdOrder() {
        List<Lot> lots = List.of(new Lot(9, 5, LocalDate.of(2027, 1, 5)), new Lot(4, 5, LocalDate.of(2027, 1, 5)));
        assertThat(PointExpiryRules.allocate(lots, 5)).containsExactly(new Take(4, 5));
    }

    @Test
    void reminderStepIsTheSmallestStepThatCoversTheDaysLeft() {
        List<Integer> steps = List.of(30, 7);
        assertThat(PointExpiryRules.reminderStep(45, steps)).isNull();
        assertThat(PointExpiryRules.reminderStep(30, steps)).isEqualTo(30);
        assertThat(PointExpiryRules.reminderStep(20, steps)).isEqualTo(30);
        assertThat(PointExpiryRules.reminderStep(7, steps)).isEqualTo(7);
        assertThat(PointExpiryRules.reminderStep(1, steps)).isEqualTo(7);
        assertThat(PointExpiryRules.reminderStep(0, steps)).isNull();
    }

    @Test
    void settingsFallBackToTheDefaults() {
        assertThat(PointExpiryRules.months(null)).isEqualTo(12);
        assertThat(PointExpiryRules.months("abc")).isEqualTo(12);
        assertThat(PointExpiryRules.months("0")).isEqualTo(12);
        assertThat(PointExpiryRules.months("24")).isEqualTo(24);
        assertThat(PointExpiryRules.start(null)).isEqualTo(START);
        assertThat(PointExpiryRules.start("nonsense")).isEqualTo(START);
        assertThat(PointExpiryRules.start("2027-07-01")).isEqualTo(LocalDate.of(2027, 7, 1));
    }

    @Test
    void invalidValuesAreRefused() {
        assertThat(PointExpiryRules.monthsProblem(12)).isNull();
        assertThat(PointExpiryRules.monthsProblem(0)).isNotNull();
        assertThat(PointExpiryRules.monthsProblem(121)).isNotNull();
        assertThat(PointExpiryRules.monthsProblem(null)).isNotNull();
        assertThat(PointExpiryRules.startProblem("2027-01-01")).isNull();
        assertThat(PointExpiryRules.startProblem("01/01/2027")).isNotNull();
        assertThat(PointExpiryRules.startProblem("")).isNotNull();
    }
}
