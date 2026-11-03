package com.anylearn.backend.service.signup;

import java.util.regex.Pattern;

/**
 * Checks of a self registration (POST /api/register), pure. Bots used to create accounts with random names
 * ("FOBGDAdlCASpcaOT") and 10 digit numbers that are not Vietnamese phones ("2826993000"), because the server checked nothing.
 */
public final class SignupRules {

    private SignupRules() {}

    public static final int MIN_PASSWORD_LENGTH = 6; // keep in step with anylearn_v2/src/config/auth.ts
    public static final int MAX_NAME_LENGTH = 60;

    /** Vietnamese mobile numbers: 10 digits starting with 03, 05, 07, 08 or 09. */
    private static final Pattern VN_MOBILE = Pattern.compile("0[35789]\\d{8}");
    private static final Pattern EMAIL = Pattern.compile("[^@\\s]+@[^@\\s]+\\.[^@\\s]+");

    /** Spaces, dots and dashes removed; +84 / 84 become 0. Null when nothing is left. */
    public static String normalizePhone(String raw) {
        if (raw == null) return null;
        String digits = raw.trim().replaceAll("[\\s.\\-()]", "");
        if (digits.startsWith("+84")) digits = "0" + digits.substring(3);
        else if (digits.startsWith("84") && digits.length() == 11) digits = "0" + digits.substring(2);
        return digits.isEmpty() ? null : digits;
    }

    public static boolean validPhone(String normalized) {
        return normalized != null && VN_MOBILE.matcher(normalized).matches();
    }

    /**
     * A name that looks generated: one word of 10+ letters with 4 or more capitals after the first letter
     * ("zNtIpYWSwablaGHDTUtRjCT"). Real names have spaces or are short.
     */
    public static boolean looksRandom(String name) {
        String n = name.trim();
        if (n.contains(" ") || n.length() < 10) return false;
        int capitals = 0;
        for (int i = 1; i < n.length(); i++) if (Character.isUpperCase(n.charAt(i))) capitals++;
        return capitals >= 4;
    }

    /** Vietnamese error text for the form, or null when the registration may go on. */
    public static String problem(String name, String phone, String email, String password) {
        if (name == null || name.trim().length() < 2) return "Vui lòng nhập họ và tên.";
        if (name.trim().length() > MAX_NAME_LENGTH) return "Họ và tên quá dài.";
        if (looksRandom(name)) return "Vui lòng nhập họ và tên thật.";
        if (!validPhone(phone)) return "Số điện thoại không hợp lệ.";
        if (email != null && !email.isBlank() && !EMAIL.matcher(email.trim()).matches()) return "Email không hợp lệ.";
        if (password == null || password.length() < MIN_PASSWORD_LENGTH) return "Mật khẩu cần ít nhất " + MIN_PASSWORD_LENGTH + " ký tự.";
        return null;
    }
}
