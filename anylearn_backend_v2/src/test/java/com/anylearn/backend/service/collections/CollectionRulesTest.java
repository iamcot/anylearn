package com.anylearn.backend.service.collections;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CollectionRulesTest {

    @Test
    void slugDropsAccentsAndPunctuation() {
        assertThat(CollectionRules.slugOf("Hè không màn hình!")).isEqualTo("he-khong-man-hinh");
        assertThat(CollectionRules.slugOf("  Thi IELTS 6.5 ")).isEqualTo("thi-ielts-6-5");
        assertThat(CollectionRules.slugOf("Đại học")).isEqualTo("dai-hoc");
    }

    @Test
    void slugValidation() {
        assertThat(CollectionRules.isValidSlug("he-khong-man-hinh")).isTrue();
        assertThat(CollectionRules.isValidSlug("He-Hoc")).isFalse();
        assertThat(CollectionRules.isValidSlug("a--b")).isFalse();
        assertThat(CollectionRules.isValidSlug("")).isFalse();
        assertThat(CollectionRules.isValidSlug(null)).isFalse();
    }

    @Test
    void seasonIncludesBothEndsAndAllowsOpenEnds() {
        LocalDate from = LocalDate.of(2026, 6, 1);
        LocalDate to = LocalDate.of(2026, 8, 31);
        assertThat(CollectionRules.isInSeason(from, to, from)).isTrue();
        assertThat(CollectionRules.isInSeason(from, to, to)).isTrue();
        assertThat(CollectionRules.isInSeason(from, to, to.plusDays(1))).isFalse();
        assertThat(CollectionRules.isInSeason(from, to, from.minusDays(1))).isFalse();
        assertThat(CollectionRules.isInSeason(null, null, from)).isTrue();
        assertThat(CollectionRules.isInSeason(from, null, from.plusYears(3))).isTrue();
    }

    @Test
    void itemListKeepsOrderAndDropsDuplicatesAndJunk() {
        assertThat(CollectionRules.distinctInOrder(Arrays.asList(5L, 3L, 5L, null, 0L, 9L))).isEqualTo(List.of(5L, 3L, 9L));
        assertThat(CollectionRules.distinctInOrder(null)).isEmpty();
    }
}
