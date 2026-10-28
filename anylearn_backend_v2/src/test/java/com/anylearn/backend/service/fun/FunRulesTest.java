package com.anylearn.backend.service.fun;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class FunRulesTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 28);

    @Test
    void dayPointsParseOrFallBackToDefaults() {
        assertThat(FunRules.parseDayPoints("1,2,3,4,5,6,7")).containsExactly(1, 2, 3, 4, 5, 6, 7);
        assertThat(FunRules.parseDayPoints(" 0, 0 ,0,0,0,0,50 ")).containsExactly(0, 0, 0, 0, 0, 0, 50);
        assertThat(FunRules.parseDayPoints(null)).isEqualTo(FunRules.DEFAULT_DAY_POINTS);
        assertThat(FunRules.parseDayPoints("1,2,3")).isEqualTo(FunRules.DEFAULT_DAY_POINTS);
        assertThat(FunRules.parseDayPoints("1,2,3,4,5,6,x")).isEqualTo(FunRules.DEFAULT_DAY_POINTS);
        assertThat(FunRules.parseDayPoints("1,2,3,4,5,6,-1")).isEqualTo(FunRules.DEFAULT_DAY_POINTS);
        assertThat(FunRules.parseDayPoints("1,2,3,4,5,6,5000")).isEqualTo(FunRules.DEFAULT_DAY_POINTS);
    }

    @Test
    void dayPointsProblemsAreReported() {
        assertThat(FunRules.dayPointsProblem(List.of(1, 2, 3, 4, 5, 6, 7))).isNull();
        assertThat(FunRules.dayPointsProblem(List.of(1, 2, 3))).isNotNull();
        assertThat(FunRules.dayPointsProblem(List.of(1, 2, 3, 4, 5, 6, -2))).isNotNull();
        assertThat(FunRules.dayPointsProblem(null)).isNotNull();
    }

    @Test
    void streakGoesOnFromYesterdayAndRestartsAfterAGap() {
        assertThat(FunRules.streakOn(null, 0, TODAY)).isEqualTo(1);
        assertThat(FunRules.streakOn(TODAY.minusDays(1), 4, TODAY)).isEqualTo(5);
        assertThat(FunRules.streakOn(TODAY.minusDays(2), 4, TODAY)).isEqualTo(1);
        assertThat(FunRules.streakOn(TODAY, 4, TODAY)).isEqualTo(4);
    }

    @Test
    void aliveStreakIsZeroAfterAMissedDay() {
        assertThat(FunRules.aliveStreak(null, 0, TODAY)).isZero();
        assertThat(FunRules.aliveStreak(TODAY, 6, TODAY)).isEqualTo(6);
        assertThat(FunRules.aliveStreak(TODAY.minusDays(1), 6, TODAY)).isEqualTo(6);
        assertThat(FunRules.aliveStreak(TODAY.minusDays(2), 6, TODAY)).isZero();
    }

    @Test
    void theWeekRepeatsAfterDaySeven() {
        assertThat(FunRules.dayInCycle(1)).isEqualTo(1);
        assertThat(FunRules.dayInCycle(7)).isEqualTo(7);
        assertThat(FunRules.dayInCycle(8)).isEqualTo(1);
        assertThat(FunRules.dayInCycle(14)).isEqualTo(7);
        assertThat(FunRules.pointsFor(FunRules.DEFAULT_DAY_POINTS, 7)).isEqualTo(20);
        assertThat(FunRules.pointsFor(FunRules.DEFAULT_DAY_POINTS, 9)).isEqualTo(5);
    }

    @Test
    void dailyBudgetCutsTheGift() {
        assertThat(FunRules.grantable(20, 1000, 0)).isEqualTo(20);
        assertThat(FunRules.grantable(20, 100, 1000)).isEqualTo(20);
        assertThat(FunRules.grantable(20, 990, 1000)).isEqualTo(10);
        assertThat(FunRules.grantable(20, 1000, 1000)).isZero();
        assertThat(FunRules.grantable(20, 2000, 1000)).isZero();
    }
}
