package com.anylearn.backend.service.location;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class LocationRulesTest {

    private static final BigDecimal LAT = new BigDecimal("10.7745");
    private static final BigDecimal LNG = new BigDecimal("106.7032");

    @Test
    void aCompleteBranchIsValid() {
        assertThat(LocationRules.validate("Cơ sở Q1", "12 Nguyễn Huệ", LAT, LNG)).isNull();
    }

    @Test
    void coordinatesAreOptionalButComeInPairs() {
        assertThat(LocationRules.validate("A", "B", null, null)).isNull();
        assertThat(LocationRules.validate("A", "B", LAT, null)).contains("vĩ độ và kinh độ");
    }

    @Test
    void swappedCoordinatesAreCaught() {
        assertThat(LocationRules.validate("A", "B", LNG, LAT)).contains("ngoài Việt Nam");
    }

    @Test
    void titleAndAddressAreRequired() {
        assertThat(LocationRules.validate(" ", "B", null, null)).isNotNull();
        assertThat(LocationRules.validate("A", null, null, null)).isNotNull();
    }
}
