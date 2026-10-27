package com.anylearn.backend.service.membership;

import java.util.List;

/** Pure rules of the member tiers (plan 10.2): which tier a spending reaches, the point multiplier, the way to the next one. */
public final class MemberTierRules {

    public static final String MEMBER = "member";
    public static final String SILVER = "silver";
    public static final String GOLD = "gold";
    public static final String DIAMOND = "diamond";
    /** Lowest to highest. */
    public static final List<String> ORDER = List.of(MEMBER, SILVER, GOLD, DIAMOND);

    private MemberTierRules() {}

    public record Thresholds(long silver, long gold, long diamond) {
        public long of(String tier) {
            return switch (tier) {
                case SILVER -> silver;
                case GOLD -> gold;
                case DIAMOND -> diamond;
                default -> 0;
            };
        }
    }

    public record Multipliers(double silver, double gold, double diamond) {
        public double of(String tier) {
            return switch (tier) {
                case SILVER -> silver;
                case GOLD -> gold;
                case DIAMOND -> diamond;
                default -> 1.0;
            };
        }
    }

    public static String label(String tier) {
        return switch (tier) {
            case SILVER -> "Bạc";
            case GOLD -> "Vàng";
            case DIAMOND -> "Kim cương";
            default -> "Thành viên";
        };
    }

    public static String tierFor(long spent12m, Thresholds t) {
        if (spent12m >= t.diamond()) return DIAMOND;
        if (spent12m >= t.gold()) return GOLD;
        if (spent12m >= t.silver()) return SILVER;
        return MEMBER;
    }

    /** The tier above, or null at the top. */
    public static String next(String tier) {
        int i = ORDER.indexOf(tier);
        return i < 0 || i >= ORDER.size() - 1 ? null : ORDER.get(i + 1);
    }

    /** Money still to spend (in the 12 month window) to reach the next tier; 0 at the top. */
    public static long remainingToNext(String tier, long spent12m, Thresholds t) {
        String next = next(tier);
        return next == null ? 0 : Math.max(0, t.of(next) - spent12m);
    }

    /** Buyer anyPoint after the tier boost, rounded; never below the base. */
    public static long boost(long basePoints, double multiplier) {
        if (basePoints <= 0 || multiplier <= 1.0) return Math.max(0, basePoints);
        return Math.round(basePoints * multiplier);
    }

    /** The problem with a threshold set, or null: each tier needs more spending than the one below. */
    public static String thresholdProblem(long silver, long gold, long diamond) {
        if (silver <= 0) return "Ngưỡng hạng Bạc phải lớn hơn 0";
        if (gold <= silver) return "Ngưỡng hạng Vàng phải lớn hơn hạng Bạc";
        if (diamond <= gold) return "Ngưỡng hạng Kim cương phải lớn hơn hạng Vàng";
        return null;
    }
}
