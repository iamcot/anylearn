package com.anylearn.backend.service.farm;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FarmTreeRulesTest {

    private static final LocalDateTime T = LocalDateTime.of(2026, 11, 9, 12, 0);

    @Test
    void slotsOpenAtLevels10To12() {
        assertEquals(10, FarmTreeRules.slotLevel(0));
        assertEquals(11, FarmTreeRules.slotLevel(1));
        assertEquals(12, FarmTreeRules.slotLevel(2));
        assertEquals(99, FarmTreeRules.slotLevel(3));
    }

    @Test
    void phaseFollowsTheCycle() {
        assertEquals(FarmTreeRules.Phase.SAPLING, FarmTreeRules.phase(T.plusHours(5), 0, 10, T));
        assertEquals(FarmTreeRules.Phase.FRUITING, FarmTreeRules.phase(T, 0, 10, T));
        assertEquals(FarmTreeRules.Phase.GROWN, FarmTreeRules.phase(T.plusHours(5), 3, 10, T));
        assertEquals(FarmTreeRules.Phase.FRUITING, FarmTreeRules.phase(T.minusHours(1), 3, 10, T));
        assertEquals(FarmTreeRules.Phase.RESTING, FarmTreeRules.phase(T.minusHours(9), 10, 10, T));
    }
}
