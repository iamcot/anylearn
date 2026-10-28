package com.anylearn.backend.service.quiz;

import java.util.*;

/** Pure rules of the helper items and of the random drops (plan 14, sections 3 and 16). */
public final class QuizItems {

    private QuizItems() {}

    public static final String MULT2 = "mult2";
    public static final String MULT3 = "mult3";
    public static final String SHIELD = "shield";
    public static final String TOPIC = "topic";
    public static final String FIFTY = "fifty";
    public static final String COMMUNITY = "community";
    public static final String TIME = "time";
    public static final String SWAP = "swap";

    /** Used before a question. */
    public static final List<String> BEFORE = List.of(MULT2, MULT3, SHIELD, TOPIC);
    /** Used inside a question. */
    public static final List<String> DURING = List.of(FIFTY, COMMUNITY, TIME, SWAP);
    public static final List<String> ALL = List.of(MULT2, MULT3, SHIELD, TOPIC, FIFTY, COMMUNITY, TIME, SWAP);

    public static final Map<String, String> LABELS = Map.of(
            MULT2, "Sao may mắn x2", MULT3, "Sao may mắn x3", SHIELD, "Khiên bảo hộ", TOPIC, "Chọn chủ đề",
            FIFTY, "50:50", COMMUNITY, "Hỏi cộng đồng", TIME, "Thêm 15 giây", SWAP, "Đổi câu");

    public static final Map<String, Integer> DEFAULT_WEIGHT = Map.of(
            FIFTY, 25, COMMUNITY, 20, TIME, 20, SWAP, 12, SHIELD, 8, MULT2, 8, TOPIC, 5, MULT3, 2);

    public static final Map<String, Integer> DEFAULT_PRICE = Map.of(
            MULT2, 30, MULT3, 60, SHIELD, 40, TOPIC, 20, FIFTY, 15, COMMUNITY, 15, TIME, 15, SWAP, 20);

    /** Most of one item a person can keep. */
    public static int cap(String item) {
        return MULT3.equals(item) ? 3 : SHIELD.equals(item) ? 5 : 10;
    }

    public static boolean known(String item) {
        return ALL.contains(item);
    }

    /**
     * Weighted pick among `candidates` (item -> weight) that are below their cap; the item at the roll, or null when
     * nothing is left. `roll` is in [0, 1).
     */
    public static String pick(Map<String, Integer> weights, Collection<String> candidates, Map<String, Integer> owned, double roll) {
        List<String> open = new ArrayList<>();
        int total = 0;
        for (String item : ALL) {
            if (!candidates.contains(item)) continue;
            if (owned.getOrDefault(item, 0) >= cap(item)) continue;
            int w = weights.getOrDefault(item, 0);
            if (w <= 0) continue;
            open.add(item);
            total += w;
        }
        if (open.isEmpty() || total <= 0) return null;
        double point = roll * total;
        double sum = 0;
        for (String item : open) {
            sum += weights.get(item);
            if (point < sum) return item;
        }
        return open.get(open.size() - 1);
    }

    /**
     * Chance (0..1) that a question gives a drop: the base chance, plus a step for each game in a row without one,
     * plus a bonus after a wrong answer; certain at `pityMax` games without a drop.
     */
    public static double dropChance(double base, double pityStep, int pity, int pityMax, boolean wrong, double wrongBonus) {
        if (pity >= pityMax) return 1;
        double chance = base + pityStep * pity + (wrong ? wrongBonus : 0);
        return Math.min(Math.max(chance, 0), 1);
    }

    /** Right answers in a row that always give an item: 3, 6, 9... */
    public static boolean streakGift(int streak, int every) {
        return every > 0 && streak > 0 && streak % every == 0;
    }

    /** What a "community" vote shows: simulated shares (percent, adding up to 100) with the right option most likely. */
    public static int[] simulatedVotes(int correctIndex, int difficulty, Random random) {
        int main = Math.max(30, 75 - (difficulty - 1) * 9 + random.nextInt(11) - 5);
        int[] out = new int[4];
        int left = 100 - main;
        List<Integer> others = new ArrayList<>(List.of(0, 1, 2, 3));
        others.remove((Integer) correctIndex);
        int a = random.nextInt(left + 1);
        int b = random.nextInt(left - a + 1);
        out[correctIndex] = main;
        out[others.get(0)] = a;
        out[others.get(1)] = b;
        out[others.get(2)] = left - a - b;
        return out;
    }

    /** Shares (percent) from real answers: counts per option; needs `minAnswers` to be used, else null. */
    public static int[] realVotes(int[] counts, int minAnswers) {
        int total = 0;
        for (int c : counts) total += c;
        if (total < minAnswers) return null;
        int[] out = new int[4];
        int sum = 0;
        int biggest = 0;
        for (int i = 0; i < 4; i++) {
            out[i] = (int) Math.round(100.0 * counts[i] / total);
            sum += out[i];
            if (counts[i] > counts[biggest]) biggest = i;
        }
        out[biggest] += 100 - sum;
        return out;
    }
}
