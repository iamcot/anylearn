package com.anylearn.backend.service.today;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SessionScheduleTest {

    private final SessionSchedule schedule = new SessionSchedule();

    private static final LocalDate TUESDAY = LocalDate.of(2026, 10, 13);

    private ScheduleSlot weekly(String weekdays, LocalDate dateStart, LocalDate dateEnd) {
        return ScheduleSlot.of(5L, "recurring", null, weekdays, "17:30", "19:00", dateStart, dateEnd);
    }

    private Session session(long scheduleId, LocalDate date, String start, String end) {
        return new Session(scheduleId, date, LocalTime.parse(start), LocalTime.parse(end));
    }

    @Test
    void expandKeepsOnlyMatchingWeekdaysInsideWindow() {
        var sessions = schedule.expand(weekly("tue,thu", null, null), DateRange.of(TUESDAY, TUESDAY.plusDays(6)));

        assertThat(sessions).extracting(Session::date).containsExactly(TUESDAY, TUESDAY.plusDays(2));
    }

    @Test
    void expandClipsToScheduleDateRange() {
        var slot = weekly("tue", TUESDAY.plusDays(7), TUESDAY.plusDays(14));

        var sessions = schedule.expand(slot, DateRange.of(TUESDAY, TUESDAY.plusDays(30)));

        assertThat(sessions).extracting(Session::date).containsExactly(TUESDAY.plusDays(7), TUESDAY.plusDays(14));
    }

    @Test
    void expandReturnsNothingWhenWindowIsOutsideScheduleRange() {
        var slot = weekly("tue", TUESDAY.plusDays(30), null);

        assertThat(schedule.expand(slot, DateRange.of(TUESDAY, TUESDAY.plusDays(6)))).isEmpty();
    }

    @Test
    void expandIgnoresUnknownWeekdayCodes() {
        var sessions = schedule.expand(weekly("xyz, mon", null, null), DateRange.of(TUESDAY, TUESDAY.plusDays(6)));

        assertThat(sessions).extracting(Session::date).containsExactly(TUESDAY.plusDays(6));
    }

    @Test
    void expandEventGivesOneSessionOnlyInsideWindow() {
        var slot = ScheduleSlot.of(9L, "event", TUESDAY.plusDays(2), null, "08:00", null, null, null);

        assertThat(schedule.expand(slot, DateRange.of(TUESDAY, TUESDAY.plusDays(3)))).hasSize(1);
        assertThat(schedule.expand(slot, DateRange.of(TUESDAY, TUESDAY.plusDays(1)))).isEmpty();
    }

    @Test
    void expandedSessionCarriesScheduleTimes() {
        Session session = schedule.expand(weekly("tue", null, null), DateRange.of(TUESDAY, TUESDAY)).get(0);

        assertThat(session.startAt()).isEqualTo(TUESDAY.atTime(17, 30));
        assertThat(session.endAt()).isEqualTo(TUESDAY.atTime(19, 0));
    }

    @Test
    void expandGivesNothingForEmptyWindow() {
        assertThat(schedule.expand(weekly("tue", null, null), DateRange.of(TUESDAY, TUESDAY.minusDays(1)))).isEmpty();
    }

    @Test
    void dateOfSessionNumberCountsTheStartDay() {
        var slot = weekly("tue,thu", null, null);

        assertThat(schedule.dateOfSessionNumber(slot, TUESDAY, 1)).contains(TUESDAY);
        assertThat(schedule.dateOfSessionNumber(slot, TUESDAY, 3)).contains(TUESDAY.plusDays(7));
    }

    @Test
    void dateOfSessionNumberIsEmptyWithoutWeekdaysOrNumber() {
        assertThat(schedule.dateOfSessionNumber(weekly(null, null, null), TUESDAY, 4)).isEmpty();
        assertThat(schedule.dateOfSessionNumber(weekly("tue", null, null), TUESDAY, 0)).isEmpty();
    }

    @Test
    void pickNextTakesEarliestSessionThatHasNotEnded() {
        var past = session(1, TUESDAY, "08:00", "09:00");
        var evening = session(2, TUESDAY, "19:45", "21:00");
        var afternoon = session(3, TUESDAY, "17:30", "19:00");

        assertThat(schedule.pickNext(List.of(evening, past, afternoon), TUESDAY.atTime(16, 10))).contains(afternoon);
    }

    @Test
    void pickNextKeepsSessionInProgress() {
        var running = session(1, TUESDAY, "17:30", "19:00");

        assertThat(schedule.pickNext(List.of(running), TUESDAY.atTime(18, 0))).contains(running);
    }

    @Test
    void pickNextSkipsSessionEndingExactlyNow() {
        var ended = session(1, TUESDAY, "17:30", "19:00");

        assertThat(schedule.pickNext(List.of(ended), TUESDAY.atTime(19, 0))).isEmpty();
    }

    @Test
    void pickNextFallsThroughToLaterDay() {
        var thursday = session(1, TUESDAY.plusDays(2), "17:30", "19:00");

        assertThat(schedule.pickNext(List.of(thursday), LocalDateTime.of(TUESDAY, LocalTime.NOON))).contains(thursday);
    }

    @Test
    void laterOnSameDayExcludesNextAndOtherDays() {
        var next = session(1, TUESDAY, "17:30", "19:00");
        var evening = session(2, TUESDAY, "19:45", "21:00");
        var tomorrow = session(3, TUESDAY.plusDays(1), "09:00", "10:00");

        assertThat(schedule.laterOnSameDay(List.of(tomorrow, evening, next), next)).containsExactly(evening);
    }

    @Test
    void joinOpensFifteenMinutesBeforeStart() {
        var evening = session(1, TUESDAY, "19:45", "21:00");

        assertThat(schedule.joinOpensAt(evening)).isEqualTo(TUESDAY.atTime(19, 30));
    }

    @Test
    void canJoinFromOpeningTimeUntilSessionEnds() {
        var evening = session(1, TUESDAY, "19:45", "21:00");

        assertThat(schedule.canJoin(evening, TUESDAY.atTime(19, 29))).isFalse();
        assertThat(schedule.canJoin(evening, TUESDAY.atTime(19, 30))).isTrue();
        assertThat(schedule.canJoin(evening, TUESDAY.atTime(20, 15))).isTrue();
        assertThat(schedule.canJoin(evening, TUESDAY.atTime(21, 0))).isFalse();
    }

    @Test
    void visibleExtraCoversTodayThroughThreeDaysAhead() {
        var sessions = List.of(
                session(1, TUESDAY.plusDays(3), "07:30", "11:00"),
                session(1, TUESDAY, "07:30", "11:00"),
                session(1, TUESDAY.plusDays(1), "07:30", "11:00"));

        assertThat(schedule.visibleExtra(sessions, TUESDAY.atTime(6, 0))).extracting(Session::date)
                .containsExactly(TUESDAY, TUESDAY.plusDays(1), TUESDAY.plusDays(3));
    }

    @Test
    void visibleExtraHidesFarFutureAndPastSessions() {
        var sessions = List.of(
                session(1, TUESDAY.plusDays(4), "07:30", "11:00"),
                session(1, TUESDAY.minusDays(1), "07:30", "11:00"));

        assertThat(schedule.visibleExtra(sessions, TUESDAY.atTime(6, 0))).isEmpty();
    }

    @Test
    void visibleExtraHidesTodaySessionOnceEnded() {
        var today = session(1, TUESDAY, "07:30", "11:00");

        assertThat(schedule.visibleExtra(List.of(today), TUESDAY.atTime(9, 0))).hasSize(1);
        assertThat(schedule.visibleExtra(List.of(today), TUESDAY.atTime(11, 0))).isEmpty();
    }

    @Test
    void periodStartFallsBackToPurchaseDayWhenNoOtherStartExists() {
        var enrollment = TodayTestData.enrollment(1L, 2L, 10L, 100L);
        enrollment.setStartDate(null);
        enrollment.setEndDate(null);
        enrollment.setCreatedAt(TUESDAY.atTime(9, 0));
        var context = new EnrollmentContext(enrollment, TodayTestData.item(10L, "Tiếng Anh", "offline"),
                TodayTestData.schedule(100L, 10L, "tue", "17:30", "19:00"));

        assertThat(schedule.periodOf(context).from()).isEqualTo(TUESDAY);
        assertThat(schedule.sessionsIn(context, DateRange.of(TUESDAY, TUESDAY.plusDays(14)))).hasSize(3);
    }

    @Test
    void periodEndComesFromPurchasedSessionCountWhenEnrollmentHasNoEnd() {
        var enrollment = TodayTestData.enrollment(1L, 2L, 10L, 100L);
        enrollment.setEndDate(null);
        enrollment.setStartDate(TUESDAY);
        var item = TodayTestData.item(10L, "Tiếng Anh", "offline");
        item.setCycleType("session");
        item.setCycleAmount(3);
        var context = new EnrollmentContext(enrollment, item, TodayTestData.schedule(100L, 10L, "tue", "17:30", "19:00"));

        assertThat(schedule.periodOf(context).to()).isEqualTo(TUESDAY.plusDays(14));
    }
}
