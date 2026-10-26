package com.anylearn.backend.service;

import com.anylearn.backend.entity.User;

import java.time.LocalDate;
import java.time.Period;

/**
 * Date-of-birth rules for the person who attends a course (the account itself or one of its children).
 * A child can first be created with only a birth year, stored as January 1st with {@code dobYearOnly}; checkout then
 * asks for the full date.
 */
public final class LearnerDob {

    public enum AgeCheck { OK, TOO_YOUNG, TOO_OLD }

    private LearnerDob() {}

    public static boolean isComplete(User learner) {
        return learner.getDob() != null && !Boolean.TRUE.equals(learner.getDobYearOnly());
    }

    /** Youngest and oldest age the learner can be on {@code today}; equal when the date of birth is complete. */
    public static int[] ageBounds(LocalDate dob, boolean yearOnly, LocalDate today) {
        int exact = Period.between(dob, today).getYears();
        return yearOnly ? new int[]{exact - 1, exact} : new int[]{exact, exact};
    }

    /** With a birth year only, a learner fails only when no possible age fits, so a real birthday never blocks them early. */
    public static AgeCheck checkAge(int[] bounds, Number min, Number max) {
        if (min != null && bounds[1] < min.intValue()) return AgeCheck.TOO_YOUNG;
        if (max != null && bounds[0] > max.intValue()) return AgeCheck.TOO_OLD;
        return AgeCheck.OK;
    }

    public static AgeCheck checkAge(User learner, Number min, Number max, LocalDate today) {
        boolean yearOnly = Boolean.TRUE.equals(learner.getDobYearOnly());
        return checkAge(ageBounds(learner.getDob(), yearOnly, today), min, max);
    }
}
