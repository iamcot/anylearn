package com.anylearn.backend.service.reviews;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReviewRewardRulesTest {

    private static final String LONG_TEXT = "a".repeat(50);

    @Test
    void textEarnsPointsFromFiftyCharactersIgnoringOuterSpaces() {
        assertEquals(20, ReviewRewardRules.textPoints(LONG_TEXT, 20));
        assertEquals(0, ReviewRewardRules.textPoints("a".repeat(49), 20));
        assertEquals(0, ReviewRewardRules.textPoints("  " + "a".repeat(40) + "  ", 20));
        assertEquals(0, ReviewRewardRules.textPoints(null, 20));
    }

    @Test
    void photosEarnPointsOnlyWhenThereIsOne() {
        assertEquals(30, ReviewRewardRules.mediaPoints(1, 30));
        assertEquals(30, ReviewRewardRules.mediaPoints(4, 30));
        assertEquals(0, ReviewRewardRules.mediaPoints(0, 30));
    }

    @Test
    void nothingIsGivenTwice() {
        assertEquals(20, ReviewRewardRules.toGrant(20, 0));
        assertEquals(0, ReviewRewardRules.toGrant(20, 20));
        assertEquals(0, ReviewRewardRules.toGrant(0, 20));
    }

    @Test
    void settingFallsBackToDefaultWhenMissingOrInvalid() {
        assertEquals(20, ReviewRewardRules.configured(null, 20));
        assertEquals(20, ReviewRewardRules.configured("abc", 20));
        assertEquals(20, ReviewRewardRules.configured("-5", 20));
        assertEquals(0, ReviewRewardRules.configured("0", 20));
        assertEquals(50, ReviewRewardRules.configured(" 50 ", 20));
    }
}
