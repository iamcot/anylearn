package com.anylearn.backend.service.reviews;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ReviewRulesTest {

    @Test
    void scoresKeepKnownCriteriaBetweenOneAndFive() {
        Map<String, Integer> scores = ReviewRules.cleanScores(Map.of("teacher", 5, "facility", 0, "progress", 4, "value", 9, "other", 3, "x", "y"));
        assertThat(scores).containsExactly(Map.entry("teacher", 5), Map.entry("progress", 4));
        assertThat(ReviewRules.cleanScores(null)).isEmpty();
    }

    @Test
    void overallRatingPrefersTheGivenStars() {
        assertThat(ReviewRules.overallRating(4, Map.of("teacher", 1))).isEqualTo(4);
        assertThat(ReviewRules.overallRating(null, Map.of("teacher", 5, "value", 4))).isEqualTo(5);
        assertThat(ReviewRules.overallRating(null, Map.of("teacher", 4, "value", 4, "facility", 3))).isEqualTo(4);
        assertThat(ReviewRules.overallRating(0, Map.of())).isEqualTo(0);
        assertThat(ReviewRules.overallRating(6, Map.of())).isEqualTo(0);
    }

    @Test
    void textIsTrimmedAndCut() {
        assertThat(ReviewRules.cleanText("  hay  ", 100)).isEqualTo("hay");
        assertThat(ReviewRules.cleanText(null, 100)).isEmpty();
        assertThat(ReviewRules.cleanText("abcdef", 3)).isEqualTo("abc");
    }

    @Test
    void mediaKeepsOnlyOurOwnUrlsOnceAndAtMostFour() {
        List<?> raw = Arrays.asList("https://cdn/x/1.jpg", "https://evil/2.jpg", "https://cdn/x/1.jpg", 5, null,
                "https://cdn/x/3.jpg", "https://cdn/x/4.jpg", "https://cdn/x/5.jpg", "https://cdn/x/6.jpg");
        assertThat(ReviewRules.cleanMedia(raw, url -> url.startsWith("https://cdn/")))
                .containsExactly("https://cdn/x/1.jpg", "https://cdn/x/3.jpg", "https://cdn/x/4.jpg", "https://cdn/x/5.jpg");
        assertThat(ReviewRules.cleanMedia(null, url -> true)).isEmpty();
    }

    @Test
    void statuses() {
        assertThat(ReviewRules.isKnownStatus("published")).isTrue();
        assertThat(ReviewRules.isKnownStatus("hidden")).isTrue();
        assertThat(ReviewRules.isKnownStatus("pending")).isFalse();
    }
}
