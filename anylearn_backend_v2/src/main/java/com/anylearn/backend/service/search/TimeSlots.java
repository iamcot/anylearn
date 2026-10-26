package com.anylearn.backend.service.search;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/** "When can my child go": weekday or weekend crossed with morning, afternoon or evening, from the course's schedules. */
public final class TimeSlots {

    public record ScheduleSlot(String weekdays, String timeStart, LocalDate eventDate) {}

    public static final List<String> ALL = List.of(
            "weekday_morning", "weekday_afternoon", "weekday_evening",
            "weekend_morning", "weekend_afternoon", "weekend_evening");

    private static final int NOON = 12;
    private static final int EVENING_FROM = 18;

    private TimeSlots() {}

    public static List<String> of(List<ScheduleSlot> schedules) {
        Set<String> slots = new LinkedHashSet<>();
        for (ScheduleSlot schedule : schedules) {
            String period = periodOf(schedule.timeStart());
            if (period == null) continue;
            for (String dayType : dayTypesOf(schedule)) slots.add(dayType + "_" + period);
        }
        return List.copyOf(slots);
    }

    static String periodOf(String timeStart) {
        if (timeStart == null || timeStart.length() < 2 || !Character.isDigit(timeStart.charAt(0))) return null;
        int hour;
        try {
            hour = Integer.parseInt(timeStart.split(":")[0].trim());
        } catch (NumberFormatException e) {
            return null;
        }
        if (hour < NOON) return "morning";
        return hour < EVENING_FROM ? "afternoon" : "evening";
    }

    private static Set<String> dayTypesOf(ScheduleSlot schedule) {
        Set<String> types = new LinkedHashSet<>();
        if (schedule.eventDate() != null) {
            DayOfWeek day = schedule.eventDate().getDayOfWeek();
            types.add(day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY ? "weekend" : "weekday");
            return types;
        }
        if (schedule.weekdays() == null) return types;
        for (String day : schedule.weekdays().split(",")) {
            String value = day.trim().toLowerCase();
            if (value.isEmpty()) continue;
            types.add(value.equals("sat") || value.equals("sun") ? "weekend" : "weekday");
        }
        return types;
    }
}
