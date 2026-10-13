package com.anylearn.backend.service.today;

import com.anylearn.backend.entity.ItemSchedule;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public record ScheduleSlot(Long scheduleId, String type, LocalDate eventDate, Set<DayOfWeek> weekdays,
                           LocalTime timeStart, LocalTime timeEnd, LocalDate dateStart, LocalDate dateEnd) {

    public static final String TYPE_EVENT = "event";

    private static final Map<String, DayOfWeek> WEEKDAY_CODES = Map.of(
            "mon", DayOfWeek.MONDAY, "tue", DayOfWeek.TUESDAY, "wed", DayOfWeek.WEDNESDAY,
            "thu", DayOfWeek.THURSDAY, "fri", DayOfWeek.FRIDAY, "sat", DayOfWeek.SATURDAY,
            "sun", DayOfWeek.SUNDAY);

    public static ScheduleSlot from(ItemSchedule schedule) {
        return of(schedule.getId(), schedule.getScheduleType(), schedule.getEventDate(), schedule.getWeekdays(),
                schedule.getTimeStart(), schedule.getTimeEnd(), schedule.getDateStart(), schedule.getDateEnd());
    }

    public static ScheduleSlot of(Long scheduleId, String type, LocalDate eventDate, String weekdays,
                                  String timeStart, String timeEnd, LocalDate dateStart, LocalDate dateEnd) {
        return new ScheduleSlot(scheduleId, type, eventDate, parseWeekdays(weekdays),
                parseTime(timeStart), parseTime(timeEnd), dateStart, dateEnd);
    }

    public boolean isEvent() {
        return TYPE_EVENT.equals(type);
    }

    public Session sessionOn(LocalDate date) {
        return new Session(scheduleId, date, timeStart, timeEnd);
    }

    private static Set<DayOfWeek> parseWeekdays(String csv) {
        Set<DayOfWeek> days = EnumSet.noneOf(DayOfWeek.class);
        if (csv == null) return days;
        for (String code : csv.split(",")) {
            DayOfWeek day = WEEKDAY_CODES.get(code.trim().toLowerCase());
            if (day != null) days.add(day);
        }
        return days;
    }

    private static LocalTime parseTime(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalTime.parse(value.trim());
        } catch (RuntimeException e) {
            return null;
        }
    }
}
