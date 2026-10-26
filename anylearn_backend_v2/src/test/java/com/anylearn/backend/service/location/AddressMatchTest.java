package com.anylearn.backend.service.location;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AddressMatchTest {

    @Test
    void theStreetPartOfTheContractAddressMustBeInTheSuggestion() {
        assertThat(AddressMatch.confident("12 Nguyễn Huệ, Quận 1, TP.HCM", "12 Nguyễn Huệ, Bến Nghé, Quận 1, Thành phố Hồ Chí Minh")).isTrue();
    }

    @Test
    void accentsAndCaseDoNotMatter() {
        assertThat(AddressMatch.confident("12 NGUYEN HUE, Q1", "12 Nguyễn Huệ, Bến Nghé, Quận 1")).isTrue();
    }

    @Test
    void aDifferentHouseNumberIsNotTheSameAddress() {
        assertThat(AddressMatch.confident("12 Nguyễn Huệ, Quận 1", "112 Nguyễn Huệ, Bến Nghé, Quận 1")).isFalse();
        assertThat(AddressMatch.confident("12 Nguyễn Huệ, Quận 1", "21 Nguyễn Huệ, Quận 1")).isFalse();
    }

    @Test
    void aDifferentStreetIsNotTheSameAddress() {
        assertThat(AddressMatch.confident("12 Lê Lợi, Quận 1", "12 Nguyễn Huệ, Quận 1")).isFalse();
    }

    @Test
    void blankAddressNeverMatches() {
        assertThat(AddressMatch.confident("", "12 Nguyễn Huệ")).isFalse();
        assertThat(AddressMatch.confident(null, "12 Nguyễn Huệ")).isFalse();
    }
}
