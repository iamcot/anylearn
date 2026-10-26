package com.anylearn.backend.service.location;

import java.math.BigDecimal;

/** Checks for a partner branch that need no database. */
public final class LocationRules {

    public static final int MAX_TEXT = 255;

    // A rough box around Vietnam, to catch swapped or mistyped coordinates.
    private static final double MIN_LAT = 8.0, MAX_LAT = 24.0, MIN_LNG = 102.0, MAX_LNG = 110.0;

    private LocationRules() {}

    public static boolean inVietnam(BigDecimal lat, BigDecimal lng) {
        if (lat == null || lng == null) return false;
        return lat.doubleValue() >= MIN_LAT && lat.doubleValue() <= MAX_LAT
                && lng.doubleValue() >= MIN_LNG && lng.doubleValue() <= MAX_LNG;
    }

    /** Null when fine, otherwise the message for the person filling the form. */
    public static String validate(String title, String address, BigDecimal lat, BigDecimal lng) {
        if (title == null || title.isBlank()) return "Thiếu tên cơ sở";
        if (address == null || address.isBlank()) return "Thiếu địa chỉ";
        if (title.trim().length() > MAX_TEXT || address.trim().length() > MAX_TEXT) return "Tên hoặc địa chỉ dài quá " + MAX_TEXT + " ký tự";
        if ((lat == null) != (lng == null)) return "Cần nhập đủ cả vĩ độ và kinh độ";
        if (lat != null && !inVietnam(lat, lng)) return "Toạ độ nằm ngoài Việt Nam, kiểm tra lại vĩ độ và kinh độ";
        return null;
    }
}
