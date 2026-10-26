package com.anylearn.backend.service.lifecycle;

import java.util.ArrayList;
import java.util.List;
import java.util.OptionalInt;
import java.util.TreeSet;

/** Pure rules of the enrollment lifecycle (plan 07): which message is due, when it may be sent, what counts as a miss. */
public final class LifecycleRules {

    public static final int MIN_SCORE = 1;
    public static final int MAX_SCORE = 5;

    private LifecycleRules() {}

    /** "3,1" -> [3, 1] (biggest first); anything that is not a positive number is dropped; null/empty gives the fallback. */
    public static List<Integer> parseDays(String text, List<Integer> fallback) {
        if (text == null || text.isBlank()) return fallback;
        TreeSet<Integer> days = new TreeSet<>(java.util.Comparator.reverseOrder());
        for (String part : text.split("[,;\\s]+")) {
            try {
                int day = Integer.parseInt(part.trim());
                if (day > 0 && day <= 365) days.add(day);
            } catch (NumberFormatException ignored) {
                // skip
            }
        }
        return days.isEmpty() ? fallback : new ArrayList<>(days);
    }

    public static int intOr(String text, int fallback, int min, int max) {
        if (text == null || text.isBlank()) return fallback;
        try {
            int value = Integer.parseInt(text.trim());
            return value >= min && value <= max ? value : fallback;
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    /**
     * The "N days before" step that is due: the smallest configured N that is still >= the days left, so a first run late
     * (2 days left with [3, 1]) sends the 3-day message and a run on the last day sends the 1-day one. The caller claims the
     * step in the database, so a step that was sent is not sent again. Empty when the date is already past.
     */
    public static OptionalInt dueDay(long daysLeft, List<Integer> days) {
        if (daysLeft < 0) return OptionalInt.empty();
        return days.stream().mapToInt(Integer::intValue).filter(day -> day >= daysLeft).min();
    }

    /** The mid-course survey is due once the given share of the sessions is over (and the course is not finished). */
    public static boolean surveyDue(int endedSessions, int totalSessions, int percent) {
        if (totalSessions < 2 || endedSessions >= totalSessions) return false;
        int needed = (int) Math.ceil(totalSessions * percent / 100.0);
        return endedSessions >= Math.max(needed, 1);
    }

    /** Sessions are given oldest first; true = the learner was there (or had an approved leave). Counts the misses at the end. */
    public static int trailingMisses(List<Boolean> presentOldestFirst) {
        int misses = 0;
        for (int i = presentOldestFirst.size() - 1; i >= 0 && !presentOldestFirst.get(i); i--) misses++;
        return misses;
    }

    /** Messages only go out inside the sending hours (fromHour inclusive, toHour exclusive). */
    public static boolean inWindow(int hour, int fromHour, int toHour) {
        return hour >= fromHour && hour < toHour;
    }

    /** Renewing while the old package or period still runs earns the early bonus. */
    public static boolean isEarlyRenewal(boolean sessionBased, int remainingSessions, java.time.LocalDate paidUntil, java.time.LocalDate today) {
        return sessionBased ? remainingSessions > 0 : paidUntil != null && !paidUntil.isBefore(today);
    }

    /** The message for a number typed in the back office, or null when it is fine. */
    public static String rangeProblem(Integer value, int min, int max, String what) {
        if (value == null || value < min || value > max) return what + " phải từ " + min + " đến " + max;
        return null;
    }

    public static String daysProblem(List<Integer> days, String what) {
        if (days == null || days.isEmpty()) return "Nhập ít nhất một mốc cho " + what + ", ví dụ 3, 1";
        for (Integer day : days) {
            if (day == null || day < 1 || day > 365) return what + ": mỗi mốc phải từ 1 đến 365 ngày";
        }
        return null;
    }

    public static boolean validScore(Integer score) {
        return score != null && score >= MIN_SCORE && score <= MAX_SCORE;
    }

    public static boolean isLow(int score, int threshold) {
        return score <= threshold;
    }

}
