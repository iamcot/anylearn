package com.anylearn.backend.service.reviews;

/** Pure rules of the anyPoint given for a review: a written review earns points, photos earn more. */
public final class ReviewRewardRules {

    public static final int MIN_TEXT_LENGTH = 50;
    public static final int DEFAULT_TEXT_POINTS = 20;
    public static final int DEFAULT_MEDIA_POINTS = 20;
    public static final int MAX_POINTS = 10_000;

    private ReviewRewardRules() {}

    /** Points for the written part: the text is long enough (spaces at the ends do not count). */
    public static int textPoints(String comment, int configured) {
        return comment != null && comment.trim().length() >= MIN_TEXT_LENGTH ? configured : 0;
    }

    public static int mediaPoints(int photoCount, int configured) {
        return photoCount > 0 ? configured : 0;
    }

    /** What is still to give: the earned amount minus what was given before, never negative. */
    public static int toGrant(int earned, int alreadyGiven) {
        return Math.max(0, earned - alreadyGiven);
    }

    /** A stored setting that is missing, not a number or out of range falls back to the default. */
    public static int configured(String stored, int fallback) {
        if (stored == null) return fallback;
        try {
            int points = Integer.parseInt(stored.trim());
            return points >= 0 && points <= MAX_POINTS ? points : fallback;
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    public static String problem(Integer points, String what) {
        if (points == null || points < 0 || points > MAX_POINTS) return what + " phải từ 0 đến " + MAX_POINTS + " anyPoint";
        return null;
    }
}
