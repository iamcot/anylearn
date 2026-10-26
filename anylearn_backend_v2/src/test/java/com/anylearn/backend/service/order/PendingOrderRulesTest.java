package com.anylearn.backend.service.order;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.OptionalInt;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class PendingOrderRulesTest {

    private static final LocalDateTime CREATED = LocalDateTime.of(2026, 10, 25, 9, 0);
    private static final List<Integer> HOURS = List.of(2, 24);

    @Test
    void parsesTheConfiguredHoursAndFallsBackToDefaults() {
        assertThat(PendingOrderRules.parseRemindHours("24, 2,2")).containsExactly(2, 24);
        assertThat(PendingOrderRules.parseRemindHours("abc,6")).containsExactly(6);
        assertThat(PendingOrderRules.parseRemindHours("x")).isEqualTo(PendingOrderRules.DEFAULT_REMIND_HOURS);
        assertThat(PendingOrderRules.parseRemindHours(null)).isEqualTo(PendingOrderRules.DEFAULT_REMIND_HOURS);
        assertThat(PendingOrderRules.parseRemindHours("0,-3")).isEqualTo(PendingOrderRules.DEFAULT_REMIND_HOURS);
    }

    @Test
    void noReminderBeforeTheFirstStep() {
        assertThat(PendingOrderRules.dueReminderStage(CREATED, CREATED.plusMinutes(119), HOURS, Set.of())).isEmpty();
    }

    @Test
    void firstStepIsDueAfterTwoHours() {
        assertThat(PendingOrderRules.dueReminderStage(CREATED, CREATED.plusHours(2), HOURS, Set.of())).isEqualTo(OptionalInt.of(1));
    }

    @Test
    void aSentStepIsNotRepeatedAndTheNextOneWaits() {
        assertThat(PendingOrderRules.dueReminderStage(CREATED, CREATED.plusHours(5), HOURS, Set.of(1))).isEmpty();
        assertThat(PendingOrderRules.dueReminderStage(CREATED, CREATED.plusHours(24), HOURS, Set.of(1))).isEqualTo(OptionalInt.of(2));
    }

    @Test
    void afterDowntimeOnlyTheLatestDueStepIsReturned() {
        assertThat(PendingOrderRules.dueReminderStage(CREATED, CREATED.plusHours(30), HOURS, Set.of())).isEqualTo(OptionalInt.of(2));
        assertThat(PendingOrderRules.dueReminderStage(CREATED, CREATED.plusHours(30), HOURS, Set.of(2))).isEmpty();
    }

    @Test
    void expiresAfterTheConfiguredHours() {
        assertThat(PendingOrderRules.isExpired(CREATED, CREATED.plusHours(71), 72)).isFalse();
        assertThat(PendingOrderRules.isExpired(CREATED, CREATED.plusHours(72), 72)).isTrue();
        assertThat(PendingOrderRules.expiresAt(CREATED, 72)).isEqualTo(CREATED.plusHours(72));
    }
}
