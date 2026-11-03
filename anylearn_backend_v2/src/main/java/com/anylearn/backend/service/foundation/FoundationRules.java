package com.anylearn.backend.service.foundation;

import java.util.ArrayList;
import java.util.List;

/**
 * Pure rules of the anyLEARN Foundation progress (plan 21): two stored numbers, the houses already built and the money
 * of the house being built. A contribution adds to the current house; every full house value finishes one house and the
 * rest goes to the next. Changing the house value never changes the built count: it only changes the current percent,
 * and a current amount already above a lowered value finishes the house at the next contribution.
 */
public final class FoundationRules {

    private FoundationRules() {}

    public record State(int housesBuilt, long currentAmount) {}

    /** The new state and the numbers of the houses this contribution finished (1-based). */
    public record Added(State state, List<Integer> finished) {}

    public static Added add(State s, long houseValue, long amount) {
        if (amount <= 0 || houseValue <= 0) return new Added(s, List.of());
        int built = s.housesBuilt();
        long current = s.currentAmount() + amount;
        List<Integer> finished = new ArrayList<>();
        while (current >= houseValue) {
            built++;
            finished.add(built);
            current -= houseValue;
        }
        return new Added(new State(built, current), finished);
    }

    /** Percent of the house being built, 0 to 100 (100 = "Sắp hoàn thành" after the value was lowered). */
    public static int percent(long current, long houseValue) {
        if (houseValue <= 0) return 0;
        return (int) Math.min(100, Math.max(0, current * 100 / houseValue));
    }

    public static long remaining(long current, long houseValue) {
        return Math.max(0, houseValue - current);
    }

    /** "1 viên gạch" / "1 xô gạch" / "1 xe rùa gạch" / "1 xe tải gạch" by the amount and the three thresholds. */
    public static String brickLabel(long amount, long bucketMin, long barrowMin, long truckMin) {
        if (amount >= truckMin) return "1 xe tải gạch";
        if (amount >= barrowMin) return "1 xe rùa gạch";
        if (amount >= bucketMin) return "1 xô gạch";
        return "1 viên gạch";
    }

    /** Bricks equivalent for a person's total ("Gạch của tôi"): one brick per brick unit (at least 1 when they gave anything). */
    public static long bricks(long total, long brickValue) {
        if (total <= 0) return 0;
        if (brickValue <= 0) return 1;
        return Math.max(1, total / brickValue);
    }

    /** Short public name: the last two words, never a phone or e-mail; hidden = "Một phụ huynh"; null user = anyLEARN. */
    public static String publicName(String name, boolean hidden, boolean isAnyLearn) {
        if (isAnyLearn) return "anyLEARN";
        if (hidden || name == null) return "Một phụ huynh";
        String t = name.trim().replaceAll("\\s+", " ");
        if (t.isEmpty() || t.contains("@") || t.replaceAll("[\\d+\\s.-]", "").isEmpty()) return "Một phụ huynh";
        String[] w = t.split(" ");
        return w.length <= 2 ? t : w[w.length - 2] + " " + w[w.length - 1];
    }

    /** Foundation share of an order in VND from its foundation points, doubled (or more) for a first order. */
    public static long orderAmount(long foundationPoints, double vndPerPoint, int multiplier) {
        if (foundationPoints <= 0) return 0;
        return Math.round(foundationPoints * vndPerPoint) * Math.max(1, multiplier);
    }
}
