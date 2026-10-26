package com.anylearn.backend.service.search;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SearchFilterBuilderTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 26);

    private static SearchFilters.Builder none() {
        return SearchFilters.Builder.empty().today(TODAY);
    }

    @Test
    void alwaysOnlyPublishedCoursesOfSignedPartners() {
        assertThat(SearchFilterBuilder.build(none().build())).containsExactly("status = 1", "userStatus = 1", "authorLive != 0");
    }

    @Test
    void oldBucketsStillWork() {
        var clauses = SearchFilterBuilder.build(none().ageBucket("6-10").priceBucket("2to5").mode("offline").provinceCode("79").build());
        assertThat(clauses).contains("agesMin <= 10", "agesMax >= 6", "price >= 2000000", "price <= 5000000",
                "subtype != \"online\"", "subtype != \"digital\"", "authorProvinceCodes = \"79\"");
    }

    @Test
    void learnerAgeKeepsCoursesWithoutLimits() {
        var clauses = SearchFilterBuilder.build(none().learnerAge(7, 8).build());
        assertThat(clauses).contains("(agesMin NOT EXISTS OR agesMin IS NULL OR agesMin <= 8)", "(agesMax NOT EXISTS OR agesMax IS NULL OR agesMax >= 7)");
    }

    @Test
    void nearUsesMetersAndCapsTheRadius() {
        assertThat(SearchFilterBuilder.build(none().near(10.77, 106.7, 5.0).build())).contains("_geoRadius(10.77, 106.7, 5000)");
        assertThat(SearchFilterBuilder.build(none().near(10.77, 106.7, null).build())).contains("_geoRadius(10.77, 106.7, 10000)");
        assertThat(SearchFilterBuilder.build(none().near(10.77, 106.7, 5000.0).build())).contains("_geoRadius(10.77, 106.7, 100000)");
    }

    @Test
    void timeSlotsAreOrdedAndUnknownOnesDropped() {
        var clauses = SearchFilterBuilder.build(none().timeSlots(List.of("weekday_evening", "weekend_morning", "bogus")).build());
        assertThat(clauses).contains("(timeSlots = \"weekday_evening\" OR timeSlots = \"weekend_morning\")");
    }

    @Test
    void flagsTagsAndStart() {
        var clauses = SearchFilterBuilder.build(none().freeTrial().onSale().tags(List.of(3L, 9L)).partnerType("school").startWithin(7).build());
        assertThat(clauses).contains("hasFreeTrial = true", "onSale = true", "(tagIds = 3 OR tagIds = 9)", "partnerType = \"school\"",
                "nextStartDay >= " + TODAY.toEpochDay(), "nextStartDay <= " + (TODAY.toEpochDay() + 7));
    }

    @Test
    void valuesCannotBreakOutOfTheQuotes() {
        var clauses = SearchFilterBuilder.build(none().category("a\" OR status = 0 OR \"b").build());
        assertThat(clauses).contains("categoryUrls = \"a\\\" OR status = 0 OR \\\"b\"");
    }
}
