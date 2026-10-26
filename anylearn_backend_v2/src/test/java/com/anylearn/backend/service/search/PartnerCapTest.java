package com.anylearn.backend.service.search;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class PartnerCapTest {

    private static Map<String, Object> hit(int id, Long author) {
        return author == null ? Map.of("id", id) : Map.of("id", id, "authorId", author);
    }

    @Test
    void keepsTwoPerPartnerInOrder() {
        var hits = List.of(hit(1, 7L), hit(2, 7L), hit(3, 8L), hit(4, 7L), hit(5, 8L), hit(6, 8L));
        assertThat(PartnerCap.limitPerPartner(hits, 2)).extracting(h -> h.get("id")).containsExactly(1, 2, 3, 5);
    }

    @Test
    void zeroKeepsEverythingAndHitsWithoutPartnerStay() {
        var hits = List.of(hit(1, 7L), hit(2, 7L), hit(3, 7L), hit(4, null), hit(5, null), hit(6, null));
        assertThat(PartnerCap.limitPerPartner(hits, 0)).hasSize(6);
        assertThat(PartnerCap.limitPerPartner(hits, 1)).extracting(h -> h.get("id")).containsExactly(1, 4, 5, 6);
    }
}
