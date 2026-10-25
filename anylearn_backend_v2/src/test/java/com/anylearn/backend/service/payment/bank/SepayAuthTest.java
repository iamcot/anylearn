package com.anylearn.backend.service.payment.bank;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SepayAuthTest {

    @Test
    void acceptsTheConfiguredKey() {
        assertThat(SepayAuth.isValid("Apikey secret-key", "secret-key")).isTrue();
        assertThat(SepayAuth.isValid("  Apikey secret-key ", "secret-key")).isTrue();
    }

    @Test
    void rejectsWrongMissingOrUnconfiguredKey() {
        assertThat(SepayAuth.isValid("Apikey other", "secret-key")).isFalse();
        assertThat(SepayAuth.isValid("secret-key", "secret-key")).isFalse();
        assertThat(SepayAuth.isValid(null, "secret-key")).isFalse();
        assertThat(SepayAuth.isValid("Apikey ", "")).isFalse();
        assertThat(SepayAuth.isValid("Apikey x", null)).isFalse();
    }
}
