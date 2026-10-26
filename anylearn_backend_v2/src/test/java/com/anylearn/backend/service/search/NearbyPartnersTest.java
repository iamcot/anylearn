package com.anylearn.backend.service.search;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class NearbyPartnersTest {

    // Around Landmark 81, Ho Chi Minh City.
    private static final double LAT = 10.795, LNG = 106.722;

    @Test
    void boundingBoxHoldsTheCircle() {
        double[] box = NearbyPartners.boundingBox(LAT, LNG, 10);
        assertThat(box[0]).isLessThan(LAT - 0.08).isGreaterThan(LAT - 0.1);
        assertThat(box[1]).isGreaterThan(LAT + 0.08);
        assertThat(box[2]).isLessThan(LNG - 0.08);
        assertThat(box[3]).isGreaterThan(LNG + 0.08);
    }

    @Test
    void keepsTheNearestBranchOfEachPartnerInsideTheRadius() {
        var branches = List.of(
                new NearbyPartners.Branch(1, "Trường A", null, "Giới thiệu", 10.80, 106.73),
                new NearbyPartners.Branch(1, "Trường A", null, "Giới thiệu", 10.796, 106.723),
                new NearbyPartners.Branch(2, "Trường B", null, "", 10.90, 106.90),
                new NearbyPartners.Branch(3, "Trường C", null, "", 10.85, 106.75));
        var result = NearbyPartners.inRadius(branches, LAT, LNG, 10);
        assertThat(result).extracting(entry -> entry.get("id")).containsExactly(1L, 3L);
        assertThat((Double) result.get(0).get("lat")).isEqualTo(10.796);
        assertThat((Double) result.get(0).get("distanceKm")).isLessThan(0.5);
    }

    @Test
    void introIsPlainTextAndShort() {
        assertThat(NearbyPartners.shortIntro("<p>Trường&nbsp;<b>mầm non</b></p>")).isEqualTo("Trường mầm non");
        assertThat(NearbyPartners.shortIntro(null)).isEmpty();
        assertThat(NearbyPartners.shortIntro("a".repeat(300))).hasSize(NearbyPartners.INTRO_LENGTH + 1).endsWith("…");
    }
}
