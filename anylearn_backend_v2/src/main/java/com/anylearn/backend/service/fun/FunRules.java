package com.anylearn.backend.service.fun;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Pure rules of the daily check-in gift on the Vui học page (plan 14). */
public final class FunRules {

    public static final int CYCLE = 7;
    public static final List<Integer> DEFAULT_DAY_POINTS = List.of(5, 5, 10, 10, 15, 15, 20);
    public static final int MAX_DAY_POINTS = 1000;

    private FunRules() {}

    /** "5,5,10,10,15,15,20" → seven values; anything else (wrong count, negative, text, too big) gives the defaults. */
    public static List<Integer> parseDayPoints(String csv) {
        if (csv == null || csv.isBlank()) return DEFAULT_DAY_POINTS;
        String[] parts = csv.split(",");
        if (parts.length != CYCLE) return DEFAULT_DAY_POINTS;
        List<Integer> points = new ArrayList<>();
        try {
            for (String part : parts) {
                int value = Integer.parseInt(part.trim());
                if (value < 0 || value > MAX_DAY_POINTS) return DEFAULT_DAY_POINTS;
                points.add(value);
            }
        } catch (NumberFormatException e) {
            return DEFAULT_DAY_POINTS;
        }
        return points;
    }

    /** Why a list of day points cannot be saved, or null when it is fine. */
    public static String dayPointsProblem(List<Integer> points) {
        if (points == null || points.size() != CYCLE) return "Cần nhập anyPoint cho đủ 7 ngày";
        for (Integer value : points) {
            if (value == null || value < 0 || value > MAX_DAY_POINTS) return "anyPoint mỗi ngày từ 0 đến " + MAX_DAY_POINTS;
        }
        return null;
    }

    /** The streak a check-in made on {@code today} has: it goes on from yesterday, stays when today is already done, else starts again at 1. */
    public static int streakOn(LocalDate lastDay, int lastStreak, LocalDate today) {
        if (lastDay == null) return 1;
        if (lastDay.equals(today)) return lastStreak;
        if (lastDay.equals(today.minusDays(1))) return lastStreak + 1;
        return 1;
    }

    /** The streak that is still alive today (0 when the last check-in was before yesterday). */
    public static int aliveStreak(LocalDate lastDay, int lastStreak, LocalDate today) {
        if (lastDay == null) return 0;
        return lastDay.equals(today) || lastDay.equals(today.minusDays(1)) ? lastStreak : 0;
    }

    /** Day 1 to 7 of the week a streak is on. */
    public static int dayInCycle(int streak) {
        return streak <= 0 ? 1 : ((streak - 1) % CYCLE) + 1;
    }

    public static int pointsFor(List<Integer> dayPoints, int streak) {
        return dayPoints.get(dayInCycle(streak) - 1);
    }

    /** How many points can still be given today under the daily budget (cap 0 = no budget). */
    public static final List<Integer> DEFAULT_ITEM_DAYS = List.of(3, 5);

    /**
     * "3,5" → days of the streak week (1 to 7) on which the check-in also gives an item; blank gives the default, "0" switches it off,
     * anything else unusable gives the default.
     */
    public static List<Integer> parseItemDays(String csv) {
        if (csv == null || csv.isBlank()) return DEFAULT_ITEM_DAYS;
        if (csv.trim().equals("0")) return List.of();
        java.util.TreeSet<Integer> days = new java.util.TreeSet<>();
        for (String part : csv.split(",")) {
            try {
                int d = Integer.parseInt(part.trim());
                if (d < 1 || d > CYCLE) return DEFAULT_ITEM_DAYS;
                days.add(d);
            } catch (NumberFormatException e) {
                return DEFAULT_ITEM_DAYS;
            }
        }
        return List.copyOf(days);
    }

    /** Text form for the admin form; a switched off list shows "0". */
    public static String itemDaysText(List<Integer> days) {
        return days.isEmpty() ? "0" : days.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(","));
    }

    public static boolean itemOn(List<Integer> itemDays, int dayInCycle) {
        return itemDays.contains(dayInCycle);
    }

    public static int grantable(int wanted, long spentToday, long dailyCap) {
        if (dailyCap <= 0) return wanted;
        long left = Math.max(dailyCap - spentToday, 0);
        return (int) Math.min(wanted, left);
    }
}
