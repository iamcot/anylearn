package com.anylearn.backend.service.order;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ZnsReminderRulesTest {

    private static final LocalDateTime CREATED = LocalDateTime.of(2026, 11, 1, 9, 0);
    private static final List<Integer> HOURS = List.of(2, 24);

    @Test
    void dueFromTheSecondStepInsideTheDay() {
        assertThat(ZnsReminderRules.due(CREATED, CREATED.plusHours(3), HOURS, 2, 72)).isFalse();
        assertThat(ZnsReminderRules.due(CREATED, CREATED.plusHours(24), HOURS, 2, 72)).isTrue();
    }

    @Test
    void waitsForTheMorningAtNight() {
        LocalDateTime created = LocalDateTime.of(2026, 11, 1, 23, 0);
        assertThat(ZnsReminderRules.due(created, created.plusHours(24), HOURS, 2, 72)).isFalse(); // 23:00
        assertThat(ZnsReminderRules.due(created, created.plusHours(33), HOURS, 2, 72)).isTrue();  // 08:00
    }

    @Test
    void notInTheLastHourBeforeCancelling() {
        assertThat(ZnsReminderRules.due(CREATED, CREATED.plusHours(71).plusMinutes(10), HOURS, 2, 72)).isFalse();
    }

    @Test
    void oneStepOnlyUsesThatStep() {
        assertThat(ZnsReminderRules.due(CREATED, CREATED.plusHours(6), List.of(6), 2, 72)).isTrue();
        assertThat(ZnsReminderRules.due(CREATED, CREATED.plusHours(5), List.of(6), 2, 72)).isFalse();
    }
}
