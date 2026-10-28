package com.anylearn.backend.service.fun;

import java.util.Arrays;
import java.util.List;

/** Pure rules of the gradual roll-out of Vui học (plan 14, phase 8): who may use a game while it is in trial. */
public final class FunAccessRules {

    private FunAccessRules() {}

    public static final String ALL = "all";
    public static final String TESTERS = "testers";
    public static final String OFF = "off";
    public static final List<String> MODES = List.of(ALL, TESTERS, OFF);
    /** The games that can be switched one by one. */
    public static final List<String> GAMES = List.of("checkin", "quiz", "sticker", "explore");

    public static String cleanMode(String raw) {
        String mode = raw == null ? ALL : raw.trim().toLowerCase();
        return MODES.contains(mode) ? mode : ALL;
    }

    /** A phone as digits with a leading 0 (+84 and 84 become 0); empty when unusable. */
    public static String cleanPhone(String raw) {
        if (raw == null) return "";
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.startsWith("84") && digits.length() == 11) digits = "0" + digits.substring(2);
        return digits.length() >= 8 && digits.length() <= 15 ? digits : "";
    }

    public static List<String> parsePhones(String text) {
        if (text == null || text.isBlank()) return List.of();
        return Arrays.stream(text.split("[,;\\s]+")).map(FunAccessRules::cleanPhone).filter(p -> !p.isEmpty()).distinct().toList();
    }

    /** Admins always get in; "all" lets everyone in, "testers" only the listed phones, "off" nobody else. */
    public static boolean allowed(String mode, boolean admin, String phone, List<String> testers) {
        if (admin) return true;
        return switch (cleanMode(mode)) {
            case ALL -> true;
            case TESTERS -> testers.contains(cleanPhone(phone));
            default -> false;
        };
    }
}
