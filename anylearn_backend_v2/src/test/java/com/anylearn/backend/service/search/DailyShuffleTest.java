package com.anylearn.backend.service.search;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

class DailyShuffleTest {

    private static final List<Integer> POOL = IntStream.rangeClosed(1, 50).boxed().toList();

    @Test
    void sameSeedGivesTheSameOrder() {
        assertThat(DailyShuffle.shuffle(POOL, "2026-10-26|c7")).isEqualTo(DailyShuffle.shuffle(POOL, "2026-10-26|c7"));
    }

    @Test
    void anotherDayOrChildGivesAnotherOrder() {
        assertThat(DailyShuffle.shuffle(POOL, "2026-10-26|c7")).isNotEqualTo(DailyShuffle.shuffle(POOL, "2026-10-27|c7"));
        assertThat(DailyShuffle.shuffle(POOL, "2026-10-26|c7")).isNotEqualTo(DailyShuffle.shuffle(POOL, "2026-10-26|c8"));
    }

    @Test
    void shuffleKeepsEveryItemOnceAndLeavesTheInputAlone() {
        List<Integer> shuffled = DailyShuffle.shuffle(POOL, "x");
        assertThat(shuffled).containsExactlyInAnyOrderElementsOf(POOL);
        assertThat(POOL.get(0)).isEqualTo(1);
    }

    @Test
    void pagesDoNotOverlapAndStopAtTheEnd() {
        List<Integer> shuffled = DailyShuffle.shuffle(POOL, "x");
        assertThat(DailyShuffle.page(shuffled, 0, 12)).hasSize(12);
        assertThat(DailyShuffle.page(shuffled, 0, 12)).doesNotContainAnyElementsOf(DailyShuffle.page(shuffled, 1, 12));
        assertThat(DailyShuffle.page(shuffled, 4, 12)).hasSize(2);
        assertThat(DailyShuffle.page(shuffled, 5, 12)).isEmpty();
    }

    @Test
    void bandsKeepTheirOrderButAreShuffledInside() {
        List<Integer> shuffled = DailyShuffle.shuffleInBands(POOL, 10, "x");
        assertThat(shuffled).hasSize(50);
        for (int band = 0; band < 5; band++) {
            List<Integer> inBand = shuffled.subList(band * 10, band * 10 + 10);
            assertThat(inBand).containsExactlyInAnyOrderElementsOf(POOL.subList(band * 10, band * 10 + 10));
        }
        assertThat(shuffled).isNotEqualTo(POOL);
        assertThat(shuffled).isEqualTo(DailyShuffle.shuffleInBands(POOL, 10, "x"));
    }
}
