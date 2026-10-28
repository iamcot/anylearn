package com.anylearn.backend.service.mission;

import com.anylearn.backend.service.quiz.QuizBoardRules;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

/** Pure rules of the weekly missions of Vui học (plan 15, section 6). Progress is counted from `game_events` of the ISO week. */
public final class MissionRules {

    private MissionRules() {}

    /**
     * One mission. Progress = number of `game_events` rows of the week with this game, one of these types and (when set) a
     * detail starting with {@code detailPrefix}; {@code distinctDays} counts days instead of rows.
     */
    public record Def(String key, String label, String game, List<String> types, String detailPrefix, boolean distinctDays,
                      int defTarget, int defReward) {}

    /** Key of the row in `fun_mission_claims` that records the weekly bonus. */
    public static final String BONUS = "bonus";

    public static final List<Def> DEFS = List.of(
            new Def("checkin_days", "Điểm danh", "checkin", List.of("claim"), null, true, 5, 30),
            new Def("quiz_correct", "Trả lời đúng ở Leo rank", "quiz", List.of("answer"), "correct", false, 20, 25),
            new Def("practice", "Tập luyện", "quiz", List.of("practice"), null, false, 10, 15),
            new Def("explore_view", "Xem bài ở Khám phá", "explore", List.of("view"), null, false, 5, 10),
            new Def("sticker_swap", "Đổi hoặc bán sticker trùng", "sticker", List.of("trade", "sell"), null, false, 1, 15),
            new Def("share", "Chia sẻ thành tích", "banner", List.of("share"), null, false, 1, 15));

    public static final int DEFAULT_BONUS_NEEDED = 5;

    public static Def find(String key) {
        for (Def d : DEFS) if (d.key().equals(key)) return d;
        return null;
    }

    /** `W2026-44`: the same key as the quiz weekly board. */
    public static String weekKey(LocalDate day) {
        return QuizBoardRules.periodKey(QuizBoardRules.WEEK, day);
    }

    /** The Monday of the week of {@code day}. */
    public static LocalDate weekStart(LocalDate day) {
        return day.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    /** The next Monday: the week ends there (exclusive). */
    public static LocalDate weekEnd(LocalDate day) {
        return weekStart(day).plusDays(7);
    }

    /** Progress shown to the player: never above the target. */
    public static int shown(long count, int target) {
        return (int) Math.max(0, Math.min(count, Math.max(target, 0)));
    }

    public static boolean complete(long count, int target) {
        return target > 0 && count >= target;
    }

    public static boolean claimable(long count, int target, boolean enabled, boolean claimed) {
        return enabled && !claimed && complete(count, target);
    }

    /** The bonus can be claimed once enough missions are complete (claimed or not) and it was not claimed this week. */
    public static boolean bonusReady(int completed, int needed, boolean bonusClaimed) {
        return !bonusClaimed && needed > 0 && completed >= needed;
    }

    /** The needed count can never be above the number of missions that are switched on. */
    public static int bonusNeeded(int configured, int enabledMissions) {
        return Math.max(1, Math.min(configured, Math.max(enabledMissions, 1)));
    }
}
