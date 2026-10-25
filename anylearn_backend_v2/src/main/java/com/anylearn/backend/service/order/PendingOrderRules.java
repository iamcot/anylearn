package com.anylearn.backend.service.order;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.OptionalInt;
import java.util.Set;

/** Pure rules for orders that wait for payment: when to remind, when to give up. */
public final class PendingOrderRules {

    public static final List<Integer> DEFAULT_REMIND_HOURS = List.of(2, 24);
    public static final int DEFAULT_AUTO_CANCEL_HOURS = 72;

    private PendingOrderRules() {}

    /** "2,24" → [2, 24]; blank or invalid parts are dropped, the result is sorted and without repeats. */
    public static List<Integer> parseRemindHours(String csv) {
        if (csv == null || csv.isBlank()) return DEFAULT_REMIND_HOURS;
        List<Integer> hours = new ArrayList<>();
        for (String part : csv.split(",")) {
            try {
                int value = Integer.parseInt(part.trim());
                if (value > 0 && !hours.contains(value)) hours.add(value);
            } catch (NumberFormatException ignored) {
                // a bad part is skipped, the rest still count
            }
        }
        if (hours.isEmpty()) return DEFAULT_REMIND_HOURS;
        hours.sort(Integer::compare);
        return hours;
    }

    /**
     * The reminder to send now: the latest step whose time has come and that was not sent yet (steps are 1-based).
     * After downtime several steps can be due at once; only the latest goes out so the buyer gets one message.
     */
    public static OptionalInt dueReminderStage(LocalDateTime createdAt, LocalDateTime now, List<Integer> remindHours, Set<Integer> sentStages) {
        long hoursWaiting = Duration.between(createdAt, now).toHours();
        for (int stage = remindHours.size(); stage >= 1; stage--) {
            if (hoursWaiting >= remindHours.get(stage - 1)) {
                return sentStages.contains(stage) ? OptionalInt.empty() : OptionalInt.of(stage);
            }
        }
        return OptionalInt.empty();
    }

    public static boolean isExpired(LocalDateTime createdAt, LocalDateTime now, int autoCancelHours) {
        return Duration.between(createdAt, now).toHours() >= autoCancelHours;
    }

    public static LocalDateTime expiresAt(LocalDateTime createdAt, int autoCancelHours) {
        return createdAt.plusHours(autoCancelHours);
    }
}
