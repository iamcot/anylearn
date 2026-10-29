package com.anylearn.backend.service.arena;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

/**
 * Pure rules of Đấu trường Leo (plan 18): the timeline of a session, ranking, rewards and the even plan of questions.
 * All times are the app clock's local time; question numbers (`qNo`) start at 1.
 */
public final class ArenaRules {

    private ArenaRules() {}

    /** Seconds an answer may arrive after the end of its question and still count (network delay), like the rank quiz. */
    public static final int GRACE_SECONDS = 2;

    public enum Kind { BEFORE, OPEN, COUNTDOWN, QUESTION, REVEAL, LOBBY, ENDED }

    public record Timing(LocalDateTime startsAt, LocalDateTime openAt, int questionCount, int countdownSeconds,
                         int answerSeconds, int revealSeconds, int gapSeconds) {}

    /** {@code millisToNext}: time to the next question (its `nextQNo`), 0 when there is none left. */
    public record Phase(Kind kind, int qNo, int nextQNo, long millisToNext) {}

    public record Slot(int level, String topic) {}

    /** One player on the board; {@code orderAt} = epoch millis of the first registration or entry (earlier ranks higher on a tie). */
    public record Entry(long userId, int score, long correctMs, long orderAt) {}

    /** When question {@code qNo} appears. */
    public static LocalDateTime questionAt(Timing t, int qNo) {
        return t.startsAt().plusSeconds((long) (qNo - 1) * t.gapSeconds());
    }

    public static LocalDateTime answerEndsAt(Timing t, int qNo) {
        return questionAt(t, qNo).plusSeconds(t.answerSeconds());
    }

    /** The moment the last reveal is over. */
    public static LocalDateTime endsAt(Timing t) {
        return answerEndsAt(t, t.questionCount()).plusSeconds(t.revealSeconds());
    }

    public static Phase phaseAt(Timing t, LocalDateTime now) {
        if (now.isBefore(t.openAt())) return new Phase(Kind.BEFORE, 0, 1, ms(now, questionAt(t, 1)));
        if (!now.isBefore(endsAt(t))) return new Phase(Kind.ENDED, 0, 0, 0);
        for (int q = 1; q <= t.questionCount(); q++) {
            LocalDateTime at = questionAt(t, q);
            if (now.isBefore(at.minusSeconds(t.countdownSeconds()))) {
                // waiting before the countdown of question q: the room is open (q = 1) or we are between questions
                return new Phase(q == 1 ? Kind.OPEN : Kind.LOBBY, q == 1 ? 0 : q - 1, q, ms(now, at));
            }
            if (now.isBefore(at)) return new Phase(Kind.COUNTDOWN, q, q, ms(now, at));
            if (now.isBefore(at.plusSeconds(t.answerSeconds()))) return new Phase(Kind.QUESTION, q, q < t.questionCount() ? q + 1 : 0, q < t.questionCount() ? ms(now, questionAt(t, q + 1)) : 0);
            if (now.isBefore(at.plusSeconds(t.answerSeconds() + t.revealSeconds()))) return new Phase(Kind.REVEAL, q, q < t.questionCount() ? q + 1 : 0, q < t.questionCount() ? ms(now, questionAt(t, q + 1)) : 0);
        }
        return new Phase(Kind.ENDED, 0, 0, 0);
    }

    private static long ms(LocalDateTime from, LocalDateTime to) {
        return Math.max(0, Duration.between(from, to).toMillis());
    }

    /** Score (high first), total time of right answers (low first), who came first, then the id so the order is stable. */
    public static Comparator<Entry> ranking() {
        return Comparator.comparingInt(Entry::score).reversed()
                .thenComparingLong(Entry::correctMs)
                .thenComparingLong(Entry::orderAt)
                .thenComparingLong(Entry::userId);
    }

    /** An answer that arrives later than the grace after the end of the question is not counted. */
    public static boolean late(LocalDateTime answeredAt, Timing t, int qNo) {
        return answeredAt.isAfter(answerEndsAt(t, qNo).plusSeconds(GRACE_SECONDS));
    }

    /** Why an answer looks suspicious, or null. */
    public static String flagReason(long ms, boolean correct, boolean away, int fastMs, boolean flagAway) {
        if (correct && fastMs > 0 && ms < fastMs) return "Trả lời đúng quá nhanh (" + ms + " ms)";
        if (flagAway && away) return "Rời khỏi trang khi đang trả lời";
        return null;
    }

    /** Whether this rank gets the top prize (coins, sticker, banner); the minimum score keeps a 0-point "winner" from being paid. */
    public static boolean topPrize(int rank, int score, int minScore, List<Integer> coins) {
        return rank >= 1 && rank <= coins.size() && coins.get(rank - 1) > 0 && score >= minScore && score > 0;
    }

    /** Leo Xu for a finished player: the prize of the rank, else the participation reward when they answered at least once. */
    public static int rewardFor(int rank, int score, int answered, List<Integer> coins, int minScore, int participation) {
        if (answered <= 0) return 0;
        if (topPrize(rank, score, minScore, coins)) return coins.get(rank - 1);
        return Math.max(0, participation);
    }

    /**
     * Splits {@code count} questions evenly over the levels (the lowest levels take the remainder) in rising order, and gives topics
     * round robin from an offset that changes every day, so topics differ by at most one question and neighbours differ.
     */
    public static List<Slot> evenPlan(int count, List<Integer> levels, List<String> topics, int topicOffset) {
        List<Integer> sorted = levels.stream().distinct().sorted().toList();
        List<Slot> out = new ArrayList<>();
        if (count <= 0 || sorted.isEmpty()) return out;
        int base = count / sorted.size();
        int extra = count % sorted.size();
        int n = 0;
        for (int i = 0; i < sorted.size(); i++) {
            int times = base + (i < extra ? 1 : 0);
            for (int k = 0; k < times; k++) {
                String topic = topics.isEmpty() ? null : topics.get(Math.floorMod(topicOffset + n, topics.size()));
                out.add(new Slot(sorted.get(i), topic));
                n++;
            }
        }
        return out;
    }

    public static LocalDate nextRunDay(LocalDate from, Set<DayOfWeek> days) {
        if (days == null || days.isEmpty()) return null;
        for (int i = 0; i < 8; i++) {
            if (days.contains(from.plusDays(i).getDayOfWeek())) return from.plusDays(i);
        }
        return null;
    }

    public static LocalTime parseTime(String text) {
        if (text == null || !text.trim().matches("([01]?\\d|2[0-3]):[0-5]\\d")) return null;
        String[] p = text.trim().split(":");
        return LocalTime.of(Integer.parseInt(p[0]), Integer.parseInt(p[1]));
    }

    /** ISO weekdays "1,2,3" → set; unusable parts are ignored. */
    public static Set<DayOfWeek> parseDays(String text) {
        Set<DayOfWeek> out = new java.util.TreeSet<>();
        if (text == null) return out;
        for (String p : text.split("[,;\\s]+")) {
            try {
                int d = Integer.parseInt(p.trim());
                if (d >= 1 && d <= 7) out.add(DayOfWeek.of(d));
            } catch (NumberFormatException ignored) {
                // skip
            }
        }
        return out;
    }

    public static List<Integer> parseInts(String text, int min, int max) {
        List<Integer> out = new ArrayList<>();
        if (text == null) return out;
        for (String p : text.split("[,;\\s]+")) {
            try {
                int v = Integer.parseInt(p.trim());
                if (v >= min && v <= max && !out.contains(v)) out.add(v);
            } catch (NumberFormatException ignored) {
                // skip
            }
        }
        return out;
    }

    public static List<String> parseWords(String text) {
        if (text == null || text.isBlank()) return List.of();
        return Arrays.stream(text.split("[,;\\s]+")).map(String::trim).filter(s -> !s.isEmpty()).distinct().toList();
    }

    /** The problem with the pace and the schedule, or null when it can run. */
    public static String validate(int countdown, int answer, int reveal, int gap, List<Integer> levels, String startTime, Set<DayOfWeek> days) {
        if (parseTime(startTime) == null) return "Giờ bắt đầu cần dạng HH:mm, ví dụ 20:00";
        if (days == null || days.isEmpty()) return "Chọn ít nhất một ngày trong tuần";
        if (levels == null || levels.isEmpty()) return "Chọn ít nhất một cấp độ câu hỏi";
        int need = countdown + answer + reveal + 10;
        if (gap < need) return "Khoảng cách giữa hai câu phải từ " + need + " giây trở lên (đếm ngược + trả lời + xem đáp án + 10 giây)";
        return null;
    }
}
