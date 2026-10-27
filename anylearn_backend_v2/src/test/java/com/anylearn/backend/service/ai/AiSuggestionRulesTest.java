package com.anylearn.backend.service.ai;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiSuggestionRulesTest {

    @Test
    void parsePicksKeepsOnlyKnownUniqueIdsAndToleratesWordsAroundJson() {
        String text = "Đây là kết quả:\n{\"picks\":[{\"id\":5,\"reason\":\"Bé thích vẽ\"},{\"id\":99,\"reason\":\"không có\"},"
                + "{\"id\":5,\"reason\":\"lặp\"},{\"id\":7,\"reason\":\"Hợp tuổi\"},{\"id\":8,\"reason\":\"quá số lượng\"}]} hết.";
        Map<Long, String> picks = AiSuggestionRules.parsePicks(text, Set.of(5L, 7L, 8L), 2);
        assertEquals(List.of(5L, 7L), List.copyOf(picks.keySet()));
        assertEquals("Bé thích vẽ", picks.get(5L));
    }

    @Test
    void parsePicksReturnsEmptyForBrokenText() {
        assertTrue(AiSuggestionRules.parsePicks("xin lỗi", Set.of(1L), 5).isEmpty());
        assertTrue(AiSuggestionRules.parsePicks("{\"picks\": [", Set.of(1L), 5).isEmpty());
        assertTrue(AiSuggestionRules.parsePicks(null, Set.of(1L), 5).isEmpty());
    }

    @Test
    void topUpFillsFromTheRuleRankingWithoutRepeats() {
        Map<Long, String> filled = AiSuggestionRules.topUp(Map.of(2L, "AI"), List.of(1L, 2L, 3L, 4L), Map.of(1L, "luật 1", 3L, "luật 3"), 3);
        assertEquals(List.of(2L, 1L, 3L), List.copyOf(filled.keySet()));
        assertEquals("luật 1", filled.get(1L));
    }

    @Test
    void feedbackReasonsMustMatchTheRating() {
        assertEquals(List.of("too_far"), AiSuggestionRules.cleanReasons(List.of("too_far", "right_age", "bogus", "too_far"), -1));
        assertEquals(List.of("right_age"), AiSuggestionRules.cleanReasons(List.of("too_far", "right_age"), 1));
        assertEquals(List.of("Quá xa", "Giá cao"), AiSuggestionRules.reasonLabels("too_far,too_expensive"));
    }
}
