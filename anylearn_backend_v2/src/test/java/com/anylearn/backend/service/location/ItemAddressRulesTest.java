package com.anylearn.backend.service.location;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ItemAddressRulesTest {

    @Test
    void onlineCodeAndVideoCoursesNeedNoAddress() {
        assertThat(ItemAddressRules.requiresAddress("online", null)).isFalse();
        assertThat(ItemAddressRules.requiresAddress("digital", null)).isFalse();
        assertThat(ItemAddressRules.requiresAddress("video", null)).isFalse();
        assertThat(ItemAddressRules.requiresAddress(null, null)).isFalse();
    }

    @Test
    void placeBasedCoursesNeedOne() {
        assertThat(ItemAddressRules.requiresAddress("offline", "school")).isTrue();
        assertThat(ItemAddressRules.requiresAddress("extra", null)).isTrue();
        assertThat(ItemAddressRules.requiresAddress("preschool", null)).isTrue();
    }

    @Test
    void anAppPartnerNeedsNoAddressWhateverTheFormat() {
        assertThat(ItemAddressRules.requiresAddress("offline", "app")).isFalse();
    }

    @Test
    void aSingleAddressIsAppliedAutomatically() {
        assertThat(ItemAddressRules.resolve(List.of(7L), null, "khóa học").id()).isEqualTo(7L);
        assertThat(ItemAddressRules.resolve(List.of(7L), 99L, "khóa học").id()).isEqualTo(7L);
    }

    @Test
    void severalAddressesNeedAChoice() {
        assertThat(ItemAddressRules.resolve(List.of(7L, 8L), 8L, "khóa học").id()).isEqualTo(8L);
        var undecided = ItemAddressRules.resolve(List.of(7L, 8L), null, "khóa học");
        assertThat(undecided.ok()).isFalse();
        assertThat(undecided.problem()).contains("Chọn địa chỉ");
    }

    @Test
    void noAddressAtAllBlocksSaving() {
        var none = ItemAddressRules.resolve(List.of(), null, "khóa học");
        assertThat(none.ok()).isFalse();
        assertThat(none.problem()).contains("Đối tác chưa có địa chỉ");
    }

    @Test
    void aNewClassTakesEveryTickedAddressOfThePartner() {
        assertThat(ItemAddressRules.chosenFor(List.of(7L, 8L, 9L), List.of(8L, 9L, 99L), "ca học")).containsExactly(8L, 9L);
    }

    @Test
    void aNewClassWithNothingTickedUsesTheOnlyAddressOrAsks() {
        assertThat(ItemAddressRules.chosenFor(List.of(7L), List.of(), "ca học")).containsExactly(7L);
        assertThatThrownBy(() -> ItemAddressRules.chosenFor(List.of(7L, 8L), List.of(), "khóa học")).hasMessageContaining("Chọn địa chỉ");
    }
}
