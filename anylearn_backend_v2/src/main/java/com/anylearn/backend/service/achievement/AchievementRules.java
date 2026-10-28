package com.anylearn.backend.service.achievement;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;

/** Pure rules of the shareable achievement banners (plan 14, section 11). */
public final class AchievementRules {

    private AchievementRules() {}

    public static final String RANKUP = "rankup";
    public static final String STREAK = "streak";
    public static final String BOARD = "board";
    public static final String STICKER_SET = "sticker_set";
    public static final List<String> TYPES = List.of(RANKUP, STREAK, BOARD, STICKER_SET);

    private static final String ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    /** A short random token for the public share link (12 characters, no look-alike letters). */
    public static String newToken() {
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < 12; i++) out.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        return out.toString();
    }

    public static boolean validToken(String token) {
        return token != null && token.matches("[a-z0-9]{12}");
    }

    /** "7,14,30" → [7,14,30]; an unusable text gives the fallback. Days from 2 to 3650, ascending. */
    public static List<Integer> parseMilestones(String text, List<Integer> fallback) {
        if (text == null || text.isBlank()) return fallback;
        try {
            List<Integer> out = new ArrayList<>();
            for (String part : text.split(",")) {
                int v = Integer.parseInt(part.trim());
                if (v < 2 || v > 3650) return fallback;
                out.add(v);
            }
            return out.isEmpty() ? fallback : out.stream().sorted().distinct().toList();
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    public static boolean isMilestone(int streak, List<Integer> milestones) {
        return milestones.contains(streak);
    }

    /** The game id of the invitation link a banner carries (the register page opens that game). */
    public static String gameOf(String type) {
        return STICKER_SET.equals(type) ? "sticker" : "quiz";
    }
}
