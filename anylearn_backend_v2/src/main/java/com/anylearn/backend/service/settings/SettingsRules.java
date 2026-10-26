package com.anylearn.backend.service.settings;

import java.util.List;

/** Pure checks of the values an admin types in the operations settings page. */
public final class SettingsRules {

    public static final int DEFAULT_NEAR_RADIUS_KM = 10;
    public static final int MIN_NEAR_RADIUS_KM = 1;
    public static final int MAX_NEAR_RADIUS_KM = 100;
    public static final int MAX_HOURS = 24 * 30;

    private SettingsRules() {}

    /** The radius of "Gần tôi" in km: a stored value that is missing, not a number or out of range falls back to 10. */
    public static int nearRadiusKm(String stored) {
        if (stored == null) return DEFAULT_NEAR_RADIUS_KM;
        try {
            int km = Integer.parseInt(stored.trim());
            return km >= MIN_NEAR_RADIUS_KM && km <= MAX_NEAR_RADIUS_KM ? km : DEFAULT_NEAR_RADIUS_KM;
        } catch (NumberFormatException e) {
            return DEFAULT_NEAR_RADIUS_KM;
        }
    }

    /** Null when the radius is fine, otherwise the message to show. */
    public static String nearRadiusProblem(Integer km) {
        if (km == null || km < MIN_NEAR_RADIUS_KM || km > MAX_NEAR_RADIUS_KM) {
            return "Bán kính \"Gần tôi\" phải từ " + MIN_NEAR_RADIUS_KM + " đến " + MAX_NEAR_RADIUS_KM + " km";
        }
        return null;
    }

    public static String hoursProblem(Integer hours, String what) {
        if (hours == null || hours < 1 || hours > MAX_HOURS) return what + " phải từ 1 đến " + MAX_HOURS + " giờ";
        return null;
    }

    /** "2, 24" is fine; every part must be a whole number of hours. Null when valid. */
    public static String remindHoursProblem(List<Integer> hours) {
        if (hours == null || hours.isEmpty()) return "Nhập ít nhất một mốc giờ nhắc, ví dụ 2, 24";
        for (Integer hour : hours) {
            String problem = hoursProblem(hour, "Mốc giờ nhắc");
            if (problem != null) return problem;
        }
        return null;
    }
}
