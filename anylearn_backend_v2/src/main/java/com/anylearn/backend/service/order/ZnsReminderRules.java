package com.anylearn.backend.service.order;

import com.anylearn.backend.service.zns.ZnsTemplates;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/** When the ZNS payment reminder of an unpaid order is due. Pure, tested in ZnsReminderRulesTest. */
public final class ZnsReminderRules {

    /** No ZNS when the order is cancelled within this many minutes: the buyer could not act on it. */
    static final int MIN_MINUTES_BEFORE_DEADLINE = 60;

    private ZnsReminderRules() {}

    /**
     * Due from reminder step `fromStage` (1-based; the last step when there are fewer), inside 8h-21h, and at least an
     * hour before the order is cancelled.
     */
    public static boolean due(LocalDateTime createdAt, LocalDateTime now, List<Integer> remindHours, int fromStage, int autoCancelHours) {
        if (createdAt == null || remindHours == null || remindHours.isEmpty()) return false;
        if (!ZnsTemplates.inSendWindow(now.getHour())) return false;
        int index = Math.min(Math.max(fromStage, 1), remindHours.size()) - 1;
        if (Duration.between(createdAt, now).toHours() < remindHours.get(index)) return false;
        LocalDateTime deadline = PendingOrderRules.expiresAt(createdAt, autoCancelHours);
        return now.plusMinutes(MIN_MINUTES_BEFORE_DEADLINE).isBefore(deadline);
    }
}
