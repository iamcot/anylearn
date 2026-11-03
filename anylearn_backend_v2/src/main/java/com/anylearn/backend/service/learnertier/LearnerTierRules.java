package com.anylearn.backend.service.learnertier;

import java.util.List;

/**
 * Pure rules of the learner tier (plan 21): a learner's tier is the number of courses they finished.
 * A course is finished when a video course is 100% done, when a class is over and the learner attended at least
 * the set percent of its sessions, or when the parent pressed "Đã hoàn thành" (an admin can revoke any of them).
 */
public final class LearnerTierRules {

    private LearnerTierRules() {}

    public record Tier(String key, String label, String icon) {}

    /** Growth names, from a seed to a big tree; thresholds come from the settings (first is always 0). */
    public static final List<Tier> TIERS = List.of(
            new Tier("seed", "Hạt mầm", "🌱"),
            new Tier("sprout", "Chồi non", "🌿"),
            new Tier("leaf", "Lá xanh", "🍀"),
            new Tier("tree", "Cây non", "🌳"),
            new Tier("bigtree", "Đại thụ", "🏆"));

    /** Index of the tier for a number of finished courses; thresholds[i] = courses needed for tier i (thresholds[0] = 0). */
    public static int tierIndex(int finished, List<Integer> thresholds) {
        int idx = 0;
        for (int i = 0; i < thresholds.size(); i++) if (finished >= thresholds.get(i)) idx = i;
        return idx;
    }

    /** Courses still needed for the next tier, or 0 at the top. */
    public static int toNext(int finished, List<Integer> thresholds) {
        int idx = tierIndex(finished, thresholds);
        return idx + 1 < thresholds.size() ? Math.max(0, thresholds.get(idx + 1) - finished) : 0;
    }

    /** A class is finished when every bought session is over and enough of them were attended. */
    public static boolean classFinished(int totalSessions, int endedSessions, int attended, int percent) {
        if (totalSessions <= 0) return false;
        if (endedSessions < totalSessions) return false;
        return attended * 100L >= (long) percent * totalSessions;
    }

    /** A video course is finished when every visible lesson is done. */
    public static boolean videoFinished(int lessons, int done) {
        return lessons > 0 && done >= lessons;
    }
}
