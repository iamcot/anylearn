package com.anylearn.backend.service.today;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PackageCardsTest {

    private final PackageCards packages = new PackageCards(new SessionSchedule());

    private static final LocalDate START = LocalDate.of(2026, 9, 1);
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 13);

    private List<Session> dailySessions(int count) {
        List<Session> sessions = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            sessions.add(new Session(1L, START.plusDays(i), LocalTime.of(17, 30), LocalTime.of(19, 0)));
        }
        return sessions;
    }

    @Test
    void progressCountsEndedSessionsAgainstPurchasedTotal() {
        var progress = packages.progressOf(dailySessions(12), 12, START.plusDays(8).atTime(12, 0));

        assertThat(progress.used()).isEqualTo(8);
        assertThat(progress.total()).isEqualTo(12);
        assertThat(progress.remaining()).isEqualTo(4);
    }

    @Test
    void progressDoesNotCountSessionInProgress() {
        assertThat(packages.progressOf(dailySessions(12), 12, START.plusDays(8).atTime(18, 0)).used()).isEqualTo(8);
    }

    @Test
    void progressTotalFallsBackToSessionCountWithoutPurchasedNumber() {
        var progress = packages.progressOf(dailySessions(10), null, START.atTime(23, 0));

        assertThat(progress.total()).isEqualTo(10);
        assertThat(progress.used()).isEqualTo(1);
    }

    @Test
    void progressUsedNeverExceedsPurchasedTotal() {
        var progress = packages.progressOf(dailySessions(15), 12, START.plusDays(30).atStartOfDay());

        assertThat(progress.used()).isEqualTo(12);
        assertThat(progress.remaining()).isZero();
    }

    @Test
    void renewShowsFromThreeSessionsLeft() {
        assertThat(packages.shouldShowRenew(4)).isFalse();
        assertThat(packages.shouldShowRenew(3)).isTrue();
        assertThat(packages.shouldShowRenew(0)).isTrue();
    }

    @Test
    void packageIsVisibleWhileSessionsRemainOrEndDateUnknown() {
        assertThat(packages.isVisible(2, TODAY.minusDays(90), TODAY)).isTrue();
        assertThat(packages.isVisible(0, null, TODAY)).isTrue();
    }

    @Test
    void finishedPackageStaysThirtyDaysThenDisappears() {
        assertThat(packages.isVisible(0, TODAY.minusDays(30), TODAY)).isTrue();
        assertThat(packages.isVisible(0, TODAY.minusDays(31), TODAY)).isFalse();
    }
}
