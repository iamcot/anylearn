package com.anylearn.backend.exception;

import java.util.List;

/** Checkout refused because some learners in the cart only have a birth year (or none). */
public class LearnerDobRequiredException extends RuntimeException {

    public static final String CODE = "LEARNER_DOB_REQUIRED";

    private final List<Long> learnerIds;

    public LearnerDobRequiredException(List<Long> learnerIds) {
        super("Vui lòng nhập ngày sinh đầy đủ của người học trước khi thanh toán");
        this.learnerIds = List.copyOf(learnerIds);
    }

    public List<Long> getLearnerIds() {
        return learnerIds;
    }
}
