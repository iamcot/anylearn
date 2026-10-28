package com.anylearn.backend.service.quiz;

import java.time.LocalDate;
import java.time.temporal.IsoFields;
import java.util.ArrayList;
import java.util.List;

/** Pure rules of the rank quiz leaderboards (plan 14, section 6): period keys, display names, settlement prizes. */
public final class QuizBoardRules {

    private QuizBoardRules() {}

    public static final String WEEK = "week";
    public static final String MONTH = "month";

    /** `W2026-44` (ISO week, starts Monday) or `M2026-10`. */
    public static String periodKey(String kind, LocalDate day) {
        if (MONTH.equals(kind)) return String.format("M%d-%02d", day.getYear(), day.getMonthValue());
        return String.format("W%d-%02d", day.get(IsoFields.WEEK_BASED_YEAR), day.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR));
    }

    /** The period a key belongs to: `week` for `W…`, `month` for `M…`, null for anything else. */
    public static String kindOf(String period) {
        if (period == null) return null;
        if (period.matches("W\\d{4}-\\d{2}")) return WEEK;
        if (period.matches("M\\d{4}-\\d{2}")) return MONTH;
        return null;
    }

    /** A period can only be settled once it is over, so the key must be older than the current one. */
    public static boolean isOver(String period, LocalDate today) {
        String kind = kindOf(period);
        return kind != null && period.compareTo(periodKey(kind, today)) < 0;
    }

    /** The period that ended just before `today`. */
    public static String lastPeriod(String kind, LocalDate today) {
        return periodKey(kind, MONTH.equals(kind) ? today.withDayOfMonth(1).minusDays(1) : today.minusWeeks(1));
    }

    /** Name shown on a board: the last two words of the name, never a phone number or an e-mail. */
    public static String displayName(String name) {
        if (name == null) return "Người chơi";
        String trimmed = name.trim().replaceAll("\\s+", " ");
        if (trimmed.isEmpty() || trimmed.contains("@") || trimmed.replaceAll("[\\d+\\s.-]", "").isEmpty()) return "Người chơi";
        String[] words = trimmed.split(" ");
        if (words.length <= 2) return trimmed;
        return words[words.length - 2] + " " + words[words.length - 1];
    }

    /** "3,2,1" → [3,2,1]; an unusable text gives the fallback. At most three places. */
    public static List<Integer> parsePrizes(String text, List<Integer> fallback) {
        if (text == null || text.isBlank()) return fallback;
        try {
            List<Integer> out = new ArrayList<>();
            for (String part : text.split(",")) {
                int v = Integer.parseInt(part.trim());
                if (v < 0 || v > 20) return fallback;
                out.add(v);
            }
            return out.isEmpty() || out.size() > 3 ? fallback : out;
        } catch (NumberFormatException e) {
            return fallback;
        }
    }
}
