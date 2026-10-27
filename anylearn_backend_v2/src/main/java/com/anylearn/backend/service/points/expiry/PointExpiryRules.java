package com.anylearn.backend.service.points.expiry;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Pure rules of anyPoint expiry (plan 02.5). */
public final class PointExpiryRules {

    public static final int DEFAULT_MONTHS = 12;
    public static final int MIN_MONTHS = 1;
    public static final int MAX_MONTHS = 120;
    public static final LocalDate DEFAULT_START = LocalDate.of(2027, 1, 1);

    private PointExpiryRules() {}

    /** A lot of points: how many are left and the day they were earned. */
    public record Lot(long id, long remaining, LocalDate earnedOn) {}

    /** Points taken from one lot. */
    public record Take(long lotId, long points) {}

    /** The day the points of a lot are removed: months after the later of the earned day and the start day. Points earned before the start count from the start. */
    public static LocalDate expiresOn(LocalDate earnedOn, LocalDate start, int months) {
        LocalDate from = earnedOn.isBefore(start) ? start : earnedOn;
        return from.plusMonths(months);
    }

    /** The last day the points can still be used. */
    public static LocalDate lastUsableDay(LocalDate earnedOn, LocalDate start, int months) {
        return expiresOn(earnedOn, start, months).minusDays(1);
    }

    public static boolean isExpired(LocalDate earnedOn, LocalDate start, int months, LocalDate today) {
        return !today.isBefore(expiresOn(earnedOn, start, months));
    }

    /** Spend `amount` from the lots that expire first (the oldest). Returns what to take from each lot; less than `amount` in total when the lots hold less. */
    public static List<Take> allocate(List<Lot> lots, long amount) {
        List<Lot> ordered = new ArrayList<>(lots);
        ordered.sort((a, b) -> {
            int byDay = a.earnedOn().compareTo(b.earnedOn());
            return byDay != 0 ? byDay : Long.compare(a.id(), b.id());
        });
        List<Take> takes = new ArrayList<>();
        long left = amount;
        for (Lot lot : ordered) {
            if (left <= 0) break;
            if (lot.remaining() <= 0) continue;
            long take = Math.min(lot.remaining(), left);
            takes.add(new Take(lot.id(), take));
            left -= take;
        }
        return takes;
    }

    /** Null when the months are fine, otherwise the message to show. */
    public static String monthsProblem(Integer months) {
        if (months == null || months < MIN_MONTHS || months > MAX_MONTHS) {
            return "Hạn dùng anyPoint phải từ " + MIN_MONTHS + " đến " + MAX_MONTHS + " tháng";
        }
        return null;
    }

    public static int months(String stored) {
        if (stored == null) return DEFAULT_MONTHS;
        try {
            int months = Integer.parseInt(stored.trim());
            return monthsProblem(months) == null ? months : DEFAULT_MONTHS;
        } catch (NumberFormatException e) {
            return DEFAULT_MONTHS;
        }
    }

    /** A stored ISO date (yyyy-MM-dd), or the default start when missing or unreadable. */
    public static LocalDate start(String stored) {
        if (stored == null || stored.isBlank()) return DEFAULT_START;
        try {
            return LocalDate.parse(stored.trim());
        } catch (Exception e) {
            return DEFAULT_START;
        }
    }

    /** Null when the start day is fine. */
    public static String startProblem(String value) {
        if (value == null || value.isBlank()) return "Chọn ngày bắt đầu tính hạn anyPoint";
        try {
            LocalDate.parse(value.trim());
            return null;
        } catch (Exception e) {
            return "Ngày bắt đầu tính hạn anyPoint không đúng (yyyy-MM-dd)";
        }
    }

    /**
     * Which reminder step a lot is due for: the smallest step that is at least the days left (30 and 7: 20 days left = 30, 5 = 7).
     * Null when it is further away than the biggest step or the day has come. The caller sends each step once.
     */
    public static Integer reminderStep(long daysLeft, List<Integer> steps) {
        if (daysLeft <= 0) return null;
        Integer best = null;
        for (int step : steps) {
            if (daysLeft <= step && (best == null || step < best)) best = step;
        }
        return best;
    }
}
