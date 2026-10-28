package com.anylearn.backend.service.mission;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.HashSet;

import static org.junit.jupiter.api.Assertions.*;

class MissionRulesTest {

    @Test
    void weekKeyIsIsoWeekAndMatchesTheBoard() {
        assertEquals("W2026-44", MissionRules.weekKey(LocalDate.of(2026, 10, 28)));
        assertEquals("W2026-44", MissionRules.weekKey(LocalDate.of(2026, 10, 26)));
        assertEquals("W2026-45", MissionRules.weekKey(LocalDate.of(2026, 11, 2)));
        assertEquals("W2026-53", MissionRules.weekKey(LocalDate.of(2027, 1, 1)));
    }

    @Test
    void weekRunsFromMondayToNextMonday() {
        LocalDate wed = LocalDate.of(2026, 10, 28);
        assertEquals(LocalDate.of(2026, 10, 26), MissionRules.weekStart(wed));
        assertEquals(LocalDate.of(2026, 10, 26), MissionRules.weekStart(LocalDate.of(2026, 10, 26)));
        assertEquals(LocalDate.of(2026, 10, 26), MissionRules.weekStart(LocalDate.of(2026, 11, 1)));
        assertEquals(LocalDate.of(2026, 11, 2), MissionRules.weekEnd(wed));
    }

    @Test
    void progressIsCappedAtTheTarget() {
        assertEquals(3, MissionRules.shown(3, 5));
        assertEquals(5, MissionRules.shown(9, 5));
        assertEquals(0, MissionRules.shown(-1, 5));
    }

    @Test
    void claimNeedsCompleteEnabledAndUnclaimed() {
        assertTrue(MissionRules.claimable(5, 5, true, false));
        assertFalse(MissionRules.claimable(4, 5, true, false));
        assertFalse(MissionRules.claimable(5, 5, false, false));
        assertFalse(MissionRules.claimable(5, 5, true, true));
        assertFalse(MissionRules.complete(0, 0));
    }

    @Test
    void bonusNeedsEnoughMissionsOnce() {
        assertTrue(MissionRules.bonusReady(5, 5, false));
        assertFalse(MissionRules.bonusReady(4, 5, false));
        assertFalse(MissionRules.bonusReady(6, 5, true));
        assertEquals(3, MissionRules.bonusNeeded(5, 3));
        assertEquals(5, MissionRules.bonusNeeded(5, 6));
        assertEquals(1, MissionRules.bonusNeeded(5, 0));
    }

    @Test
    void missionListIsFixedAndKeysAreUnique() {
        assertEquals(6, MissionRules.DEFS.size());
        assertEquals(6, new HashSet<>(MissionRules.DEFS.stream().map(MissionRules.Def::key).toList()).size());
        assertEquals(30, MissionRules.find("checkin_days").defReward());
        assertNull(MissionRules.find("nope"));
        assertNotEquals(MissionRules.BONUS, MissionRules.DEFS.get(0).key());
    }
}
