package com.anylearn.backend.service.today;

public enum FeeCardState {
    HIDDEN,
    DUE_SOON,
    OVERDUE,
    AWAITING_CONFIRMATION;

    public boolean needsPayment() {
        return this == DUE_SOON || this == OVERDUE;
    }
}
