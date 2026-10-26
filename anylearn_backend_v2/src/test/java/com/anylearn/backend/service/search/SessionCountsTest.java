package com.anylearn.backend.service.search;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SessionCountsTest {

    @Test
    void sessionsAndDaysCountAsTheyAre() {
        assertThat(SessionCounts.estimate("session", 12, 0)).isEqualTo(12);
        assertThat(SessionCounts.estimate("day", 5, 0)).isEqualTo(5);
    }

    @Test
    void weeksAndMonthsNeedTheWeekdays() {
        assertThat(SessionCounts.estimate("week", 8, 2)).isEqualTo(16);
        assertThat(SessionCounts.estimate("month", 3, 2)).isEqualTo(24);
        assertThat(SessionCounts.estimate("month", 3, 0)).isNull();
    }

    @Test
    void unknownOrEmptyGivesNothing() {
        assertThat(SessionCounts.estimate(null, 3, 1)).isNull();
        assertThat(SessionCounts.estimate("session", 0, 1)).isNull();
        assertThat(SessionCounts.estimate("decade", 2, 1)).isNull();
    }

    @Test
    void pricePerSessionRounds() {
        assertThat(SessionCounts.pricePerSession(3_000_000L, 16)).isEqualTo(187_500L);
        assertThat(SessionCounts.pricePerSession(1_000_000L, 3)).isEqualTo(333_333L);
        assertThat(SessionCounts.pricePerSession(1_000_000L, null)).isNull();
        assertThat(SessionCounts.pricePerSession(0L, 4)).isNull();
    }
}
