package com.anylearn.backend.service.search;

/** Number of sessions of a course, from its length (`cycle_type` + `cycle_amount`), to compare price per session. */
public final class SessionCounts {

    private static final int WEEKS_PER_MONTH = 4;
    private static final int WEEKS_PER_YEAR = 48;

    private SessionCounts() {}

    /** Null when it cannot be told, e.g. a length in weeks with no weekday on the schedule. */
    public static Integer estimate(String cycleType, Integer cycleAmount, int weekdaysPerWeek) {
        if (cycleType == null || cycleAmount == null || cycleAmount <= 0) return null;
        return switch (cycleType) {
            case "session", "day" -> cycleAmount;
            case "week" -> weekdaysPerWeek > 0 ? cycleAmount * weekdaysPerWeek : null;
            case "month" -> weekdaysPerWeek > 0 ? cycleAmount * WEEKS_PER_MONTH * weekdaysPerWeek : null;
            case "year" -> weekdaysPerWeek > 0 ? cycleAmount * WEEKS_PER_YEAR * weekdaysPerWeek : null;
            default -> null;
        };
    }

    public static Long pricePerSession(Long price, Integer sessions) {
        if (price == null || price <= 0 || sessions == null || sessions <= 0) return null;
        return Math.round((double) price / sessions);
    }
}
