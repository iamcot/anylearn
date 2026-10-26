package com.anylearn.backend.service.location;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AdministrativeMatcherTest {

    private static final List<AdministrativeMatcher.Entry> PROVINCES = List.of(
            new AdministrativeMatcher.Entry("79", "Hồ Chí Minh"), new AdministrativeMatcher.Entry("01", "Hà Nội"));
    private static final List<AdministrativeMatcher.Entry> DISTRICTS = List.of(
            new AdministrativeMatcher.Entry("760", "1"), new AdministrativeMatcher.Entry("769", "Thủ Đức"),
            new AdministrativeMatcher.Entry("761", "12"));

    @Test
    void matchesProvinceWithTypePrefix() {
        assertThat(AdministrativeMatcher.matchCode(PROVINCES, "Thành phố Hồ Chí Minh")).contains("79");
        assertThat(AdministrativeMatcher.matchCode(PROVINCES, "Ha Noi")).contains("01");
    }

    @Test
    void numberedDistrictsDoNotMixOne_AndTwelve() {
        assertThat(AdministrativeMatcher.matchCode(DISTRICTS, "Quận 1")).contains("760");
        assertThat(AdministrativeMatcher.matchCode(DISTRICTS, "Quận 12")).contains("761");
    }

    @Test
    void matchesDistrictWithAccentsIgnored() {
        assertThat(AdministrativeMatcher.matchCode(DISTRICTS, "Thành phố Thủ Đức")).contains("769");
        assertThat(AdministrativeMatcher.matchCode(DISTRICTS, "thu duc")).contains("769");
    }

    @Test
    void unknownOrMissingNameGivesNothing() {
        assertThat(AdministrativeMatcher.matchCode(PROVINCES, "Đà Nẵng")).isEmpty();
        assertThat(AdministrativeMatcher.matchCode(PROVINCES, null)).isEmpty();
        assertThat(AdministrativeMatcher.matchCode(PROVINCES, "  ")).isEmpty();
    }
}
