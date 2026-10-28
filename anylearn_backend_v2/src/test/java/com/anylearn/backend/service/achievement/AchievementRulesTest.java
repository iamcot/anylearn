package com.anylearn.backend.service.achievement;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AchievementRulesTest {

    @Test
    void onlyTheFirstShareOfABannerPays() {
        assertEquals(10, AchievementRules.shareReward(true, 0, 2, 10));
        assertEquals(10, AchievementRules.shareReward(true, 1, 2, 10));
        assertEquals(0, AchievementRules.shareReward(false, 0, 2, 10));
    }

    @Test
    void dailyLimitAndSwitchStopTheReward() {
        assertEquals(0, AchievementRules.shareReward(true, 2, 2, 10));
        assertEquals(0, AchievementRules.shareReward(true, 0, 0, 10));
        assertEquals(0, AchievementRules.shareReward(true, 0, 2, 0));
    }

    @Test
    void tokenShape() {
        assertTrue(AchievementRules.validToken(AchievementRules.newToken()));
        assertFalse(AchievementRules.validToken("short"));
    }
}
