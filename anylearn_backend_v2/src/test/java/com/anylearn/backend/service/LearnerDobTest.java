package com.anylearn.backend.service;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.LearnerDob.AgeCheck;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class LearnerDobTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 25);

    private static User learner(LocalDate dob, boolean yearOnly) {
        User user = new User();
        user.setDob(dob);
        user.setDobYearOnly(yearOnly);
        return user;
    }

    @Test
    void aDateOfBirthIsCompleteOnlyWithTheFullDate() {
        assertThat(LearnerDob.isComplete(learner(null, false))).isFalse();
        assertThat(LearnerDob.isComplete(learner(LocalDate.of(2015, 1, 1), true))).isFalse();
        assertThat(LearnerDob.isComplete(learner(LocalDate.of(2015, 3, 2), false))).isTrue();
    }

    @Test
    void aFullDateGivesOneExactAge() {
        assertThat(LearnerDob.ageBounds(LocalDate.of(2015, 12, 24), false, TODAY)).containsExactly(10, 10);
        assertThat(LearnerDob.ageBounds(LocalDate.of(2015, 10, 25), false, TODAY)).containsExactly(11, 11);
    }

    @Test
    void aBirthYearGivesTwoPossibleAges() {
        assertThat(LearnerDob.ageBounds(LocalDate.of(2015, 1, 1), true, TODAY)).containsExactly(10, 11);
    }

    @Test
    void aBirthYearOnlyFailsWhenNoPossibleAgeFits() {
        int[] tenOrEleven = {10, 11};
        assertThat(LearnerDob.checkAge(tenOrEleven, 11, 15)).isEqualTo(AgeCheck.OK);
        assertThat(LearnerDob.checkAge(tenOrEleven, 6, 10)).isEqualTo(AgeCheck.OK);
        assertThat(LearnerDob.checkAge(tenOrEleven, 12, 15)).isEqualTo(AgeCheck.TOO_YOUNG);
        assertThat(LearnerDob.checkAge(tenOrEleven, 3, 9)).isEqualTo(AgeCheck.TOO_OLD);
    }

    @Test
    void theExactDateDecidesAtTheBoundary() {
        User bornLateInYear = learner(LocalDate.of(2015, 12, 24), false);
        assertThat(LearnerDob.checkAge(bornLateInYear, 11, 15, TODAY)).isEqualTo(AgeCheck.TOO_YOUNG);
        assertThat(LearnerDob.checkAge(bornLateInYear, 6, 10, TODAY)).isEqualTo(AgeCheck.OK);
    }

    @Test
    void openEndedRangesAlwaysPass() {
        assertThat(LearnerDob.checkAge(new int[]{4, 5}, null, null)).isEqualTo(AgeCheck.OK);
    }

    @Test
    void applyDobKeepsTheYearOnlyFlagFromTheRequest() {
        User child = learner(null, false);
        Map<String, Object> body = new HashMap<>();
        body.put("dob", "2015-01-01");
        body.put("dobYearOnly", true);

        UserService.applyDob(child, body);

        assertThat(child.getDob()).isEqualTo(LocalDate.of(2015, 1, 1));
        assertThat(child.getDobYearOnly()).isTrue();
    }

    @Test
    void aFullDateClearsTheYearOnlyFlag() {
        User child = learner(LocalDate.of(2015, 1, 1), true);

        UserService.applyDob(child, new HashMap<>(Map.of("dob", "2015-03-02")));

        assertThat(child.getDob()).isEqualTo(LocalDate.of(2015, 3, 2));
        assertThat(child.getDobYearOnly()).isFalse();
    }

    @Test
    void applyDobIgnoresMissingOrBrokenDates() {
        User child = learner(LocalDate.of(2015, 3, 2), false);

        UserService.applyDob(child, new HashMap<>(Map.of("name", "Bin")));
        UserService.applyDob(child, new HashMap<>(Map.of("dob", "not-a-date", "dobYearOnly", true)));

        assertThat(child.getDob()).isEqualTo(LocalDate.of(2015, 3, 2));
        assertThat(child.getDobYearOnly()).isFalse();
    }
}
