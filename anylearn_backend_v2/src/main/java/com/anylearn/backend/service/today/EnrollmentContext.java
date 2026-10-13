package com.anylearn.backend.service.today;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.ItemSchedule;
import com.anylearn.backend.entity.UserCourseEnrollment;

public record EnrollmentContext(UserCourseEnrollment enrollment, Item item, ItemSchedule schedule) {

    private static final String SESSION_CYCLE = "session";

    public boolean hasSchedule() {
        return schedule != null;
    }

    public boolean isFee() {
        return schedule == null && Integer.valueOf(1).equals(item.getIsPaymentfee());
    }

    public SessionMode mode() {
        return SessionMode.of(item.getSubtype());
    }

    public boolean isSessionBased() {
        return SESSION_CYCLE.equals(item.getCycleType());
    }

    public Integer purchasedSessions() {
        return SESSION_CYCLE.equals(item.getCycleType()) ? item.getCycleAmount() : null;
    }

    public ScheduleSlot slot() {
        return ScheduleSlot.from(schedule);
    }
}
