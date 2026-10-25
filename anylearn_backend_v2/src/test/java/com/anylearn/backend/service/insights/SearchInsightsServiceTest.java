package com.anylearn.backend.service.insights;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.BigInteger;

import static org.assertj.core.api.Assertions.assertThat;

class SearchInsightsServiceTest {

    @Test
    void keepsTheRequestedPeriodWithinLimits() {
        assertThat(SearchInsightsService.clampDays(null)).isEqualTo(30);
        assertThat(SearchInsightsService.clampDays(0)).isEqualTo(30);
        assertThat(SearchInsightsService.clampDays(7)).isEqualTo(7);
        assertThat(SearchInsightsService.clampDays(9999)).isEqualTo(365);
    }

    @Test
    void turnsSqlNumbersIntoPlainLongs() {
        var map = SearchInsightsService.toMap(new Object[]{"bóng đá", new BigDecimal("12"), BigInteger.valueOf(3), null},
                "keyword", "searches", "noResult", "clicked");

        assertThat(map).containsEntry("keyword", "bóng đá").containsEntry("searches", 12L)
                .containsEntry("noResult", 3L).containsEntry("clicked", null);
    }
}
