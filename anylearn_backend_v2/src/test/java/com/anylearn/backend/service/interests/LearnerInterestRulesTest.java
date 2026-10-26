package com.anylearn.backend.service.interests;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LearnerInterestRulesTest {

    @Test
    void keepsKnownInterestsOnceInOrder() {
        assertThat(LearnerInterestRules.cleanInterests(List.of("chess", "football", "art", "chess", 5)))
                .containsExactly("chess", "art");
    }

    @Test
    void keepsAtMostEightInterests() {
        List<String> all = List.copyOf(LearnerInterestRules.INTERESTS);
        assertThat(LearnerInterestRules.cleanInterests(all)).hasSize(LearnerInterestRules.MAX_PER_QUESTION);
    }

    @Test
    void emptyOrMissingAnswersGiveNothing() {
        assertThat(LearnerInterestRules.cleanInterests(null)).isEmpty();
        assertThat(LearnerInterestRules.cleanInterests(Arrays.asList(null, ""))).isEmpty();
    }

    @Test
    void budgetMustBeOneOfTheRanges() {
        assertThat(LearnerInterestRules.cleanBudget("500_1000")).isEqualTo("500_1000");
        assertThat(LearnerInterestRules.cleanBudget("cheap")).isNull();
        assertThat(LearnerInterestRules.cleanBudget(500)).isNull();
        assertThat(LearnerInterestRules.cleanBudget(null)).isNull();
    }
}
