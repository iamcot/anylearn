package com.anylearn.backend.service.today;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Start date of a flexible ("open", "Linh hoạt") class. The parent picks a day when adding to the cart (one of the
 * next class days, or any day: the class then starts on the first class day on or after it), and may change it once
 * more from the account page while the class has not started. Pure, tested in {@code FlexibleStartRulesTest}.
 */
public final class FlexibleStartRules {

    public static final String TYPE_OPEN = "open";
    /** Class days searched ahead of a picked day before giving up (a class meets at least once a week). */
    private static final int SEARCH_DAYS = 14;

    private FlexibleStartRules() {}

    /** The first day a class may start: today. */
    public static LocalDate earliest(LocalDate today) {
        return today;
    }

    /**
     * The first class day on or after {@code from} (never before the class's own start date, never after its end).
     * A class without weekdays meets any day, so the day itself. Empty when the class has ended by then.
     */
    public static Optional<LocalDate> firstClassDay(ScheduleSlot slot, LocalDate from) {
        LocalDate day = from;
        if (slot.dateStart() != null && slot.dateStart().isAfter(day)) day = slot.dateStart();
        LocalDate limit = day.plusDays(slot.weekdays().isEmpty() ? 0 : SEARCH_DAYS);
        for (; !day.isAfter(limit); day = day.plusDays(1)) {
            if (slot.dateEnd() != null && day.isAfter(slot.dateEnd())) return Optional.empty();
            if (slot.weekdays().isEmpty() || slot.weekdays().contains(day.getDayOfWeek())) return Optional.of(day);
        }
        return Optional.empty();
    }

    /** The start of a picked day: the first class day on or after it, and not before today. */
    public static Optional<LocalDate> resolve(ScheduleSlot slot, LocalDate picked, LocalDate today) {
        LocalDate from = picked == null || picked.isBefore(earliest(today)) ? earliest(today) : picked;
        return firstClassDay(slot, from);
    }

    /** The next {@code count} class days from today (fewer when the class ends sooner). */
    public static List<LocalDate> suggestions(ScheduleSlot slot, LocalDate today, int count) {
        List<LocalDate> days = new ArrayList<>();
        LocalDate from = earliest(today);
        while (days.size() < count) {
            Optional<LocalDate> next = firstClassDay(slot, from);
            if (next.isEmpty()) break;
            days.add(next.get());
            from = next.get().plusDays(1);
        }
        return days;
    }

    /**
     * The account page lets the parent pick (or change) the start once: not when it was already changed there, and
     * not once the class has started.
     */
    public static boolean canChangeFromAccount(LocalDate start, LocalDateTime changedAt, LocalDate today) {
        return changedAt == null && (start == null || start.isAfter(today));
    }

    /** Last day of the course from its start: the n-th class day for a session count, else the paid period. */
    public static LocalDate endDate(ScheduleSlot slot, LocalDate start, String cycleType, Integer cycleAmount) {
        if (cycleType == null || cycleAmount == null || cycleAmount <= 0) return null;
        if ("session".equals(cycleType)) {
            if (slot.weekdays().isEmpty()) return null;
            int found = 0;
            for (LocalDate day = start; !day.isAfter(start.plusYears(5)); day = day.plusDays(1)) {
                if (slot.weekdays().contains(day.getDayOfWeek()) && ++found == cycleAmount) return day;
            }
            return null;
        }
        return switch (cycleType) {
            case "year" -> start.plusYears(cycleAmount).minusDays(1);
            case "week" -> start.plusWeeks(cycleAmount).minusDays(1);
            case "day" -> start.plusDays(cycleAmount).minusDays(1);
            default -> start.plusMonths(cycleAmount).minusDays(1);
        };
    }
}
