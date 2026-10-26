package com.anylearn.backend.service.search;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GeoTest {

    @Test
    void benThanhMarketToTanSonNhatIsAboutSixKm() {
        assertThat(Geo.distanceKm(10.7725, 106.6980, 10.8185, 106.6588)).isBetween(5.5, 7.0);
    }

    @Test
    void samePointIsZero() {
        assertThat(Geo.distanceKm(10.0, 106.0, 10.0, 106.0)).isZero();
    }
}
