package com.anylearn.backend.service.today;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SessionKeyTest {

    @Test
    void roundTripsThroughText() {
        var key = new SessionKey(5L, LocalDate.of(2026, 10, 13));

        assertThat(key.toString()).isEqualTo("5_20261013");
        assertThat(SessionKey.parse("5_20261013")).isEqualTo(key);
    }

    @Test
    void rejectsMalformedValues() {
        assertThatThrownBy(() -> SessionKey.parse("abc")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> SessionKey.parse("5_2026-10-13")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> SessionKey.parse("x_20261013")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> SessionKey.parse(null)).isInstanceOf(IllegalArgumentException.class);
    }
}
