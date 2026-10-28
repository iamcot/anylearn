package com.anylearn.backend.service.quiz;

import java.util.List;

/** Pure rules of stars, ranks and the start-of-rank guard of the rank quiz (plan 14, section 2). */
public final class QuizProgress {

    private QuizProgress() {}

    /** Stars needed to leave each rank (the last rank, Huyền thoại, has no ceiling). */
    public static final List<Integer> DEFAULT_STARS = List.of(5, 6, 7, 8, 10, 12, 15);

    public record State(int rank, int stars, int guard) {}

    public record Result(State after, boolean correct, int starsGained, boolean rankedUp, boolean rankedDown,
                         boolean guardLost, boolean shieldUsed) {}

    /** Stars needed to leave `rank`, or 0 when that rank has no ceiling. */
    public static int needed(List<Integer> stars, int rank) {
        return rank >= 0 && rank < stars.size() ? stars.get(rank) : 0;
    }

    public static State start() {
        return new State(0, 0, 1);
    }

    /**
     * Applies one graded question. `multiplier` (1, 2 or 3) counts only when the answer is right; `shield` keeps the
     * stars and the guard when it is wrong. A new rank starts with 1 star (the extra stars of a big win carry over). Losing the
     * last star of a rank above the lowest only empties it (guard off); the next miss drops the rank (to `max - 1`
     * stars of the lower rank, guard back); the lowest rank never drops.
     */
    public static Result apply(List<Integer> stars, State before, boolean correct, int multiplier, boolean shield) {
        int rank = before.rank();
        int have = before.stars();
        int guard = before.guard();
        int last = stars.size();
        if (correct) {
            int gained = Math.max(multiplier, 1);
            have += gained;
            boolean up = false;
            while (rank < last && have >= needed(stars, rank)) {
                have = have - needed(stars, rank) + 1;
                rank++;
                up = true;
                guard = 1;
            }
            if (have >= 1) guard = 1;
            return new Result(new State(rank, have, guard), true, gained, up, false, false, false);
        }
        if (shield) return new Result(before, false, 0, false, false, false, true);
        if (have > 0) {
            have--;
            if (have == 0 && rank > 0) guard = 0;
            return new Result(new State(rank, have, guard), false, -1, false, false, false, false);
        }
        if (guard == 1) return new Result(new State(rank, 0, 0), false, 0, false, false, true, false);
        if (rank > 0) {
            int lower = rank - 1;
            return new Result(new State(lower, Math.max(needed(stars, lower) - 1, 0), 1), false, 0, false, true, false, false);
        }
        return new Result(before, false, 0, false, false, false, false);
    }

    /** Lets the team's saved list win when it is usable (7 whole numbers from 1 to 100), else the default. */
    public static List<Integer> parseStars(String text) {
        if (text == null || text.isBlank()) return DEFAULT_STARS;
        try {
            List<Integer> out = new java.util.ArrayList<>();
            for (String part : text.split(",")) out.add(Integer.parseInt(part.trim()));
            if (out.size() != DEFAULT_STARS.size()) return DEFAULT_STARS;
            for (int v : out) if (v < 1 || v > 100) return DEFAULT_STARS;
            return out;
        } catch (NumberFormatException e) {
            return DEFAULT_STARS;
        }
    }
}
