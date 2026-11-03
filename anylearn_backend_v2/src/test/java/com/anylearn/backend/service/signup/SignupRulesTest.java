package com.anylearn.backend.service.signup;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SignupRulesTest {

    @Test
    void normalizesVietnamesePhones() {
        assertThat(SignupRules.normalizePhone("+84 901 234 567")).isEqualTo("0901234567");
        assertThat(SignupRules.normalizePhone("84901234567")).isEqualTo("0901234567");
        assertThat(SignupRules.normalizePhone("090.123.4567")).isEqualTo("0901234567");
        assertThat(SignupRules.normalizePhone("  ")).isNull();
    }

    @Test
    void acceptsOnlyVietnameseMobiles() {
        assertThat(SignupRules.validPhone("0967126687")).isTrue();
        assertThat(SignupRules.validPhone("0844152779")).isTrue();
        // numbers the bots used
        assertThat(SignupRules.validPhone("2826993000")).isFalse();
        assertThat(SignupRules.validPhone("4918858565")).isFalse();
        assertThat(SignupRules.validPhone("0123456789")).isFalse();
        assertThat(SignupRules.validPhone("090123456")).isFalse();
    }

    @Test
    void spotsGeneratedNames() {
        assertThat(SignupRules.looksRandom("FOBGDAdlCASpcaOT")).isTrue();
        assertThat(SignupRules.looksRandom("zNtIpYWSwablaGHDTUtRjCT")).isTrue();
        assertThat(SignupRules.looksRandom("MCpfbgSLlWfsLAjrdtg")).isTrue();
        assertThat(SignupRules.looksRandom("Thái Trúc Linh")).isFalse();
        assertThat(SignupRules.looksRandom("Nguyễn Nhật Huy")).isFalse();
        assertThat(SignupRules.looksRandom("Huy")).isFalse();
        assertThat(SignupRules.looksRandom("Christopher")).isFalse();
    }

    @Test
    void problemTexts() {
        assertThat(SignupRules.problem("Nguyễn Nhật Huy", "0844152779", "", "secret1")).isNull();
        assertThat(SignupRules.problem("Nguyễn Nhật Huy", "0844152779", null, "secret1")).isNull();
        assertThat(SignupRules.problem("FOBGDAdlCASpcaOT", "0844152779", "", "secret1")).isNotNull();
        assertThat(SignupRules.problem("Nguyễn Nhật Huy", "2826993000", "", "secret1")).isEqualTo("Số điện thoại không hợp lệ.");
        assertThat(SignupRules.problem("Nguyễn Nhật Huy", "0844152779", "abc", "secret1")).isEqualTo("Email không hợp lệ.");
        assertThat(SignupRules.problem("Nguyễn Nhật Huy", "0844152779", "", "123")).isNotNull();
        assertThat(SignupRules.problem("Nguyễn Nhật Huy", "0844152779", "", null)).isNotNull();
        assertThat(SignupRules.problem(" ", "0844152779", "", "secret1")).isNotNull();
    }

    @Test
    void guardCountsPerIp() {
        SignupGuard guard = new SignupGuard();
        long t = 1_000_000_000L;
        for (int i = 0; i < SignupRules.PER_IP_HOUR; i++) {
            assertThat(guard.allowed("1.2.3.4", t)).isTrue();
            guard.record("1.2.3.4", t);
        }
        assertThat(guard.allowed("1.2.3.4", t)).isFalse();
        assertThat(guard.allowed("5.6.7.8", t)).isTrue();
        // an hour later the hourly window is free again
        assertThat(guard.allowed("1.2.3.4", t + 3_600_001L)).isTrue();
    }
}
