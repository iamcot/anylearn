package com.anylearn.backend.service.referral;

import com.anylearn.backend.entity.User;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ReferralRulesTest {

    private static User user(long id, String phone, int status, int child) {
        User u = new User();
        u.setId(id);
        u.setPhone(phone);
        u.setStatus((byte) status);
        u.setIsChild((byte) child);
        return u;
    }

    @Test
    void codeKeepsDigitsAndTurnsPlus84IntoZero() {
        assertThat(ReferralRules.cleanCode("0901 234 567")).isEqualTo("0901234567");
        assertThat(ReferralRules.cleanCode("+84901234567")).isEqualTo("0901234567");
        assertThat(ReferralRules.cleanCode("0901.234.567")).isEqualTo("0901234567");
        assertThat(ReferralRules.cleanCode("DEMOPARENT")).isEqualTo("DEMOPARENT");
    }

    @Test
    void junkCodesAreRejected() {
        assertThat(ReferralRules.cleanCode(null)).isNull();
        assertThat(ReferralRules.cleanCode("abc")).isNull();
        assertThat(ReferralRules.cleanCode("123")).isNull();
        assertThat(ReferralRules.cleanCode("1".repeat(20))).isNull();
    }

    @Test
    void gameIdIsLowerCaseAndSimple() {
        assertThat(ReferralRules.cleanGame("Quiz")).isEqualTo("quiz");
        assertThat(ReferralRules.cleanGame("sticker-2")).isEqualTo("sticker-2");
        assertThat(ReferralRules.cleanGame("a b")).isNull();
        assertThat(ReferralRules.cleanGame("<script>")).isNull();
        assertThat(ReferralRules.cleanGame(null)).isNull();
        assertThat(ReferralRules.cleanGame("x".repeat(31))).isNull();
    }

    @Test
    void referrerMustBeActiveNotChildAndNotTheSamePhone() {
        assertThat(ReferralRules.canRefer(user(1, "0901234567", 1, 0), "0912345678")).isTrue();
        assertThat(ReferralRules.canRefer(user(1, "0901234567", 0, 0), "0912345678")).isFalse();
        assertThat(ReferralRules.canRefer(user(1, "0901234567", 1, 1), "0912345678")).isFalse();
        assertThat(ReferralRules.canRefer(user(1, "0901234567", 1, 0), "0901234567")).isFalse();
        assertThat(ReferralRules.canRefer(null, "0912345678")).isFalse();
    }

    @Test
    void displayNameIsTheLastWordOnly() {
        assertThat(ReferralRules.displayName("Nguyễn Thị Lan")).isEqualTo("Lan");
        assertThat(ReferralRules.displayName("  ")).isEqualTo("một người bạn");
        assertThat(ReferralRules.displayName(null)).isEqualTo("một người bạn");
    }
}
