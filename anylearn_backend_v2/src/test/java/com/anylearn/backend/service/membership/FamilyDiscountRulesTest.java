package com.anylearn.backend.service.membership;

import com.anylearn.backend.service.membership.FamilyDiscountRules.Line;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class FamilyDiscountRulesTest {

    @Test
    void secondChildInTheSameCartGetsTheDiscount() {
        var lines = List.of(new Line(1, 10, true, 1_000_000), new Line(2, 11, true, 2_000_000), new Line(3, 10, true, 500_000));
        assertThat(FamilyDiscountRules.discounts(lines, Set.of(), 5)).isEqualTo(Map.of(2L, 100_000L));
    }

    @Test
    void childRegisteredRecentlyIsTheFirstChild() {
        var lines = List.of(new Line(1, 11, true, 1_000_000));
        assertThat(FamilyDiscountRules.discounts(lines, Set.of(10L), 10)).isEqualTo(Map.of(1L, 100_000L));
        assertThat(FamilyDiscountRules.discounts(List.of(new Line(1, 10, true, 1_000_000)), Set.of(10L), 10)).isEmpty();
    }

    @Test
    void oneChildOrTheAccountItselfGetsNothing() {
        assertThat(FamilyDiscountRules.discounts(List.of(new Line(1, 10, true, 1_000_000)), Set.of(), 5)).isEmpty();
        assertThat(FamilyDiscountRules.discounts(List.of(new Line(1, 1, false, 1_000_000), new Line(2, 10, true, 1_000_000)), Set.of(), 5)).isEmpty();
    }

    @Test
    void zeroPercentOrFreeCoursesGiveNothing() {
        var lines = List.of(new Line(1, 10, true, 1_000_000), new Line(2, 11, true, 1_000_000));
        assertThat(FamilyDiscountRules.discounts(lines, Set.of(), 0)).isEmpty();
        assertThat(FamilyDiscountRules.discounts(List.of(new Line(1, 10, true, 1_000_000), new Line(2, 11, true, 0)), Set.of(), 5)).isEmpty();
    }
}
