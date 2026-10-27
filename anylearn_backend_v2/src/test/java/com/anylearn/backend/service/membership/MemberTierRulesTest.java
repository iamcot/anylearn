package com.anylearn.backend.service.membership;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MemberTierRulesTest {

    private static final MemberTierRules.Thresholds T = new MemberTierRules.Thresholds(3_000_000, 10_000_000, 30_000_000);

    @Test
    void tierFollowsTheSpendingThresholds() {
        assertThat(MemberTierRules.tierFor(0, T)).isEqualTo("member");
        assertThat(MemberTierRules.tierFor(2_999_999, T)).isEqualTo("member");
        assertThat(MemberTierRules.tierFor(3_000_000, T)).isEqualTo("silver");
        assertThat(MemberTierRules.tierFor(10_000_000, T)).isEqualTo("gold");
        assertThat(MemberTierRules.tierFor(45_000_000, T)).isEqualTo("diamond");
    }

    @Test
    void remainingToTheNextTier() {
        assertThat(MemberTierRules.remainingToNext("silver", 8_800_000, T)).isEqualTo(1_200_000);
        assertThat(MemberTierRules.remainingToNext("diamond", 99_000_000, T)).isZero();
        assertThat(MemberTierRules.next("gold")).isEqualTo("diamond");
        assertThat(MemberTierRules.next("diamond")).isNull();
    }

    @Test
    void boostRoundsAndNeverLowersPoints() {
        assertThat(MemberTierRules.boost(100, 1.5)).isEqualTo(150);
        assertThat(MemberTierRules.boost(33, 1.2)).isEqualTo(40);
        assertThat(MemberTierRules.boost(100, 1.0)).isEqualTo(100);
        assertThat(MemberTierRules.boost(0, 2.0)).isZero();
    }

    @Test
    void thresholdsMustGrow() {
        assertThat(MemberTierRules.thresholdProblem(1, 2, 3)).isNull();
        assertThat(MemberTierRules.thresholdProblem(5, 5, 9)).contains("Vàng");
        assertThat(MemberTierRules.thresholdProblem(5, 9, 9)).contains("Kim cương");
    }
}
