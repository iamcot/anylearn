package com.anylearn.backend.service.today;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class FeeCardsTest {

    private final FeeCards fees = new FeeCards();

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 24);
    private static final LocalDate DECEMBER = LocalDate.of(2026, 12, 1);

    @Test
    void stateIsHiddenWhenPaidFarAhead() {
        assertThat(fees.stateOf(TODAY.plusDays(8), false, TODAY)).isEqualTo(FeeCardState.HIDDEN);
    }

    @Test
    void stateIsDueSoonFromSevenDaysBeforeUntilLastPaidDay() {
        assertThat(fees.stateOf(TODAY.plusDays(7), false, TODAY)).isEqualTo(FeeCardState.DUE_SOON);
        assertThat(fees.stateOf(TODAY, false, TODAY)).isEqualTo(FeeCardState.DUE_SOON);
    }

    @Test
    void stateIsOverdueTheDayAfterPaidPeriodEnds() {
        assertThat(fees.stateOf(TODAY.minusDays(1), false, TODAY)).isEqualTo(FeeCardState.OVERDUE);
    }

    @Test
    void pendingPaymentWinsOverOverdue() {
        assertThat(fees.stateOf(TODAY.minusDays(10), true, TODAY)).isEqualTo(FeeCardState.AWAITING_CONFIRMATION);
    }

    @Test
    void pendingPaymentShowsEvenWhenNothingWasPaidBefore() {
        assertThat(fees.stateOf(null, true, TODAY)).isEqualTo(FeeCardState.AWAITING_CONFIRMATION);
    }

    @Test
    void stateIsHiddenWhenNeverPaidAndNothingPending() {
        assertThat(fees.stateOf(null, false, TODAY)).isEqualTo(FeeCardState.HIDDEN);
    }

    @Test
    void onlyDueSoonAndOverdueNeedPayment() {
        assertThat(FeeCardState.DUE_SOON.needsPayment()).isTrue();
        assertThat(FeeCardState.OVERDUE.needsPayment()).isTrue();
        assertThat(FeeCardState.AWAITING_CONFIRMATION.needsPayment()).isFalse();
        assertThat(FeeCardState.HIDDEN.needsPayment()).isFalse();
    }

    @Test
    void paidUntilTakesLatestPeriodEnd() {
        var ends = List.of(LocalDate.of(2026, 10, 31), LocalDate.of(2026, 11, 30), LocalDate.of(2026, 9, 30));

        assertThat(fees.paidUntil(ends)).contains(LocalDate.of(2026, 11, 30));
    }

    @Test
    void paidUntilIgnoresMissingEndsAndIsEmptyWhenNothingPaid() {
        assertThat(fees.paidUntil(Arrays.asList(null, LocalDate.of(2026, 10, 31)))).contains(LocalDate.of(2026, 10, 31));
        assertThat(fees.paidUntil(List.of())).isEmpty();
    }

    @Test
    void paidUntilTextReadsNaturally() {
        assertThat(fees.paidUntilText(LocalDate.of(2026, 11, 30))).isEqualTo("hết tháng 11");
        assertThat(fees.paidUntilText(LocalDate.of(2026, 2, 28))).isEqualTo("hết tháng 2");
        assertThat(fees.paidUntilText(LocalDate.of(2026, 11, 14))).isEqualTo("hết ngày 14/11");
    }

    @Test
    void paidPeriodLabelUsesItemTitleFirstThenComputes() {
        assertThat(fees.paidPeriodLabel("  Học phí Học kỳ 2 ", DECEMBER, "month", 1)).isEqualTo("Học phí Học kỳ 2");
        assertThat(fees.paidPeriodLabel(" ", DECEMBER, "month", 1)).isEqualTo("Tháng 12");
    }

    @Test
    void periodLabelByCycle() {
        assertThat(fees.periodLabel(DECEMBER, "month", 1)).isEqualTo("Tháng 12");
        assertThat(fees.periodLabel(LocalDate.of(2026, 10, 1), "month", 3)).isEqualTo("Tháng 10–12");
        assertThat(fees.periodLabel(LocalDate.of(2026, 11, 1), "month", 3)).isEqualTo("Tháng 11–1");
        assertThat(fees.periodLabel(LocalDate.of(2026, 9, 1), "year", 1)).isEqualTo("Năm học 2026");
    }

    @Test
    void periodLabelFallsBackWhenCycleIsUnknown() {
        assertThat(fees.periodLabel(DECEMBER, "session", 12)).isEqualTo("Kỳ học phí");
        assertThat(fees.periodLabel(null, "month", 1)).isEqualTo("Kỳ học phí");
    }

    @Test
    void periodEndIsTheDayBeforeTheNextPeriodStarts() {
        assertThat(fees.periodEnd(DECEMBER, "month", 1)).isEqualTo(LocalDate.of(2026, 12, 31));
        assertThat(fees.periodEnd(LocalDate.of(2026, 10, 1), "month", 3)).isEqualTo(LocalDate.of(2026, 12, 31));
        assertThat(fees.periodEnd(LocalDate.of(2026, 9, 1), "year", 1)).isEqualTo(LocalDate.of(2027, 8, 31));
        assertThat(fees.periodEnd(DECEMBER, null, null)).isEqualTo(LocalDate.of(2026, 12, 31));
    }
}
