package com.anylearn.backend.service.payment;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PaymentMethodRulesTest {

    @Test
    void installmentShowsFromThreeMillionAndMomoOnlyInsideItsRange() {
        var installment = PaymentMethodRules.definition("installment").orElseThrow();
        var momo = PaymentMethodRules.definition("momo").orElseThrow();

        assertThat(PaymentMethodRules.offered(true, installment.defaultMin(), installment.defaultMax(), 2_999_999)).isFalse();
        assertThat(PaymentMethodRules.offered(true, installment.defaultMin(), installment.defaultMax(), 3_000_000)).isTrue();
        assertThat(PaymentMethodRules.offered(true, momo.defaultMin(), momo.defaultMax(), 50_000_001)).isFalse();
        assertThat(PaymentMethodRules.offered(true, momo.defaultMin(), momo.defaultMax(), 900)).isFalse();
    }

    @Test
    void aSwitchedOffMethodNeverShows() {
        assertThat(PaymentMethodRules.offered(false, 0, 0, 5_000_000)).isFalse();
    }

    @Test
    void maxBelowMinIsAProblem() {
        assertThat(PaymentMethodRules.problem(5_000_000, 1_000_000, "Trả góp")).isNotNull();
        assertThat(PaymentMethodRules.problem(3_000_000, 0, "Trả góp")).isNull();
    }
}
