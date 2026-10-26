package com.anylearn.backend.service.settings;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SettingsRulesTest {

    @Test
    void nearRadiusFallsBackToTenKm() {
        assertThat(SettingsRules.nearRadiusKm(null)).isEqualTo(10);
        assertThat(SettingsRules.nearRadiusKm("abc")).isEqualTo(10);
        assertThat(SettingsRules.nearRadiusKm("0")).isEqualTo(10);
        assertThat(SettingsRules.nearRadiusKm("101")).isEqualTo(10);
        assertThat(SettingsRules.nearRadiusKm(" 25 ")).isEqualTo(25);
    }

    @Test
    void nearRadiusProblemNamesTheRange() {
        assertThat(SettingsRules.nearRadiusProblem(5)).isNull();
        assertThat(SettingsRules.nearRadiusProblem(100)).isNull();
        assertThat(SettingsRules.nearRadiusProblem(0)).contains("1 đến 100");
        assertThat(SettingsRules.nearRadiusProblem(null)).isNotNull();
    }

    @Test
    void hours() {
        assertThat(SettingsRules.hoursProblem(72, "Thời gian tự hủy đơn")).isNull();
        assertThat(SettingsRules.hoursProblem(0, "Thời gian tự hủy đơn")).contains("Thời gian tự hủy đơn");
        assertThat(SettingsRules.remindHoursProblem(List.of(2, 24))).isNull();
        assertThat(SettingsRules.remindHoursProblem(List.of())).isNotNull();
        assertThat(SettingsRules.remindHoursProblem(java.util.Arrays.asList(2, null))).isNotNull();
    }
}
