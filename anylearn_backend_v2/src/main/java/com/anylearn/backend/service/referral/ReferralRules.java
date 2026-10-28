package com.anylearn.backend.service.referral;

import com.anylearn.backend.entity.User;

import java.util.regex.Pattern;

/** Pure rules for referral codes (the code of an account is its phone number or a hand-made word). */
public final class ReferralRules {

    private static final Pattern GAME_ID = Pattern.compile("^[a-z0-9_-]{1,30}$");

    private ReferralRules() {}

    private static final Pattern WORD_CODE = Pattern.compile("^[A-Za-z0-9_-]{4,30}$");

    /**
     * A phone: digits only, +84 / 84 become a leading 0. A code with letters (demo or hand-made refcodes) is kept as typed.
     * Returns null when nothing usable is left.
     */
    public static String cleanCode(String raw) {
        if (raw == null) return null;
        String trimmed = raw.trim();
        if (trimmed.matches(".*\\p{L}.*")) return WORD_CODE.matcher(trimmed).matches() ? trimmed : null;
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.startsWith("84") && digits.length() == 11) digits = "0" + digits.substring(2);
        return digits.length() >= 8 && digits.length() <= 15 ? digits : null;
    }

    /** A game id from the link, lower case; null when missing or odd. */
    public static String cleanGame(String raw) {
        if (raw == null) return null;
        String game = raw.trim().toLowerCase();
        return GAME_ID.matcher(game).matches() ? game : null;
    }

    /** Active, not a child account, and not the person registering. */
    public static boolean canRefer(User referrer, String newPhone) {
        if (referrer == null || referrer.getId() == null) return false;
        if (referrer.getStatus() != null && referrer.getStatus() == 0) return false;
        if (referrer.getIsChild() != null && referrer.getIsChild() == 1) return false;
        return newPhone == null || !newPhone.equals(referrer.getPhone());
    }

    /** What the link shows about the referrer: the last word of the name ("Lan"), never the phone. */
    public static String displayName(String name) {
        if (name == null || name.isBlank()) return "một người bạn";
        String[] parts = name.trim().split("\\s+");
        return parts[parts.length - 1];
    }
}
