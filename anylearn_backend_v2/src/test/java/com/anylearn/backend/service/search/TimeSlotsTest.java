package com.anylearn.backend.service.search;

import com.anylearn.backend.service.search.TimeSlots.ScheduleSlot;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TimeSlotsTest {

    @Test
    void weekdayEveningAndWeekendMorning() {
        var slots = TimeSlots.of(List.of(
                new ScheduleSlot("tue,thu", "18:30", null),
                new ScheduleSlot("sat", "08:00", null)));
        assertThat(slots).containsExactlyInAnyOrder("weekday_evening", "weekend_morning");
    }

    @Test
    void aScheduleOnBothKindsOfDaysGivesBoth() {
        assertThat(TimeSlots.of(List.of(new ScheduleSlot("fri,sat", "14:00", null))))
                .containsExactlyInAnyOrder("weekday_afternoon", "weekend_afternoon");
    }

    @Test
    void aSingleEventUsesItsDate() {
        assertThat(TimeSlots.of(List.of(new ScheduleSlot(null, "09:00", LocalDate.of(2026, 11, 1))))).containsExactly("weekend_morning");
    }

    @Test
    void noTimeMeansNoSlot() {
        assertThat(TimeSlots.of(List.of(new ScheduleSlot("mon", null, null), new ScheduleSlot("mon", "", null)))).isEmpty();
    }
}
