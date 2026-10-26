package com.anylearn.backend.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private static final String SECRET = "test-secret-test-secret-test-secret-123";

    @Test
    void aFreshTokenIsNotRefreshed() {
        JwtService service = new JwtService(SECRET, 60_000);
        assertThat(service.shouldRefresh(service.generateToken(1L))).isFalse();
    }

    @Test
    void aTokenPastHalfItsLifeIsRefreshed() {
        JwtService longLived = new JwtService(SECRET, 60_000);
        JwtService shortLived = new JwtService(SECRET, 120_000);
        // 60s token judged against a 120s policy: its remaining time is under half of the policy
        assertThat(shortLived.shouldRefresh(longLived.generateToken(1L))).isTrue();
    }

    @Test
    void expiredAndForgedTokensAreInvalid() {
        JwtService expired = new JwtService(SECRET, -1_000);
        JwtService service = new JwtService(SECRET, 60_000);
        assertThat(service.isValid(expired.generateToken(1L))).isFalse();
        assertThat(service.isValid(new JwtService("another-secret-another-secret-another-1", 60_000).generateToken(1L))).isFalse();
    }
}
