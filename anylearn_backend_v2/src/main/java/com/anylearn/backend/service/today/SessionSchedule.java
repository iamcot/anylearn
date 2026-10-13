package com.anylearn.backend.service.today;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Component
public class SessionSchedule {

    private static final int MAX_SEARCH_YEARS = 5;
    private static final int OPEN_ENDED_PERIOD_YEARS = 1;
    private static final Duration JOIN_OPENS_BEFORE_START = Duration.ofMinutes(15);
    private static final int EXTRA_VISIBLE_DAYS_AHEAD = 3;

    public List<Session> expand(ScheduleSlot slot, DateRange window) {
        return slot.isEvent() ? expandEvent(slot, window) : expandWeekly(slot, window);
    }

    public Optional<LocalDate> dateOfSessionNumber(ScheduleSlot slot, LocalDate start, int number) {
        if (number <= 0 || slot.weekdays().isEmpty()) return Optional.empty();
        LocalDate limit = start.plusYears(MAX_SEARCH_YEARS);
        int found = 0;
        for (LocalDate day = start; !day.isAfter(limit); day = day.plusDays(1)) {
            if (slot.weekdays().contains(day.getDayOfWeek()) && ++found == number) {
                return Optional.of(day);
            }
        }
        return Optional.empty();
    }

    public List<Session> sessionsIn(EnrollmentContext context, DateRange window) {
        DateRange period = periodOf(context);
        if (!isScheduled(context, period)) return List.of();
        return expand(context.slot(), window.intersect(period));
    }

    public List<Session> wholePeriod(EnrollmentContext context) {
        DateRange period = periodOf(context);
        if (!isScheduled(context, period) || period.from() == null) return List.of();
        LocalDate end = period.to() != null ? period.to() : period.from().plusYears(OPEN_ENDED_PERIOD_YEARS);
        return expand(context.slot(), DateRange.of(period.from(), end));
    }

    public DateRange periodOf(EnrollmentContext context) {
        if (!context.hasSchedule()) {
            return DateRange.of(context.enrollment().getStartDate(), context.enrollment().getEndDate());
        }
        ScheduleSlot slot = context.slot();
        LocalDate start = firstNonNull(context.enrollment().getStartDate(), slot.dateStart(), purchaseDay(context));
        LocalDate end = firstNonNull(context.enrollment().getEndDate(), endBySessionCount(context, start), slot.dateEnd());
        return DateRange.of(start, end);
    }

    public Optional<Session> pickNext(List<Session> sessions, LocalDateTime now) {
        return sessions.stream()
                .filter(session -> !session.hasEndedBy(now))
                .min(Comparator.comparing(Session::startAt));
    }

    public List<Session> laterOnSameDay(List<Session> sessions, Session next) {
        return sessions.stream()
                .filter(session -> session.date().equals(next.date()))
                .filter(session -> session.startAt().isAfter(next.startAt()))
                .sorted(Comparator.comparing(Session::startAt))
                .toList();
    }

    public List<Session> visibleExtra(List<Session> sessions, LocalDateTime now) {
        LocalDate today = now.toLocalDate();
        LocalDate lastVisibleDay = today.plusDays(EXTRA_VISIBLE_DAYS_AHEAD);
        return sessions.stream()
                .filter(session -> !session.date().isBefore(today) && !session.date().isAfter(lastVisibleDay))
                .filter(session -> !session.hasEndedBy(now))
                .sorted(Comparator.comparing(Session::startAt))
                .toList();
    }

    public LocalDateTime joinOpensAt(Session session) {
        return session.startAt().minus(JOIN_OPENS_BEFORE_START);
    }

    public boolean canJoin(Session session, LocalDateTime now) {
        return !now.isBefore(joinOpensAt(session)) && !session.hasEndedBy(now);
    }

    private List<Session> expandEvent(ScheduleSlot slot, DateRange window) {
        LocalDate date = slot.eventDate();
        boolean inWindow = date != null && !window.intersect(DateRange.of(date, date)).isEmpty();
        return inWindow ? List.of(slot.sessionOn(date)) : List.of();
    }

    private List<Session> expandWeekly(ScheduleSlot slot, DateRange window) {
        DateRange range = window.intersect(DateRange.of(slot.dateStart(), slot.dateEnd()));
        return range.dates().stream()
                .filter(date -> slot.weekdays().contains(date.getDayOfWeek()))
                .map(slot::sessionOn)
                .toList();
    }

    private boolean isScheduled(EnrollmentContext context, DateRange period) {
        return context.hasSchedule() && (context.slot().isEvent() || period.from() != null);
    }

    private LocalDate purchaseDay(EnrollmentContext context) {
        LocalDateTime createdAt = context.enrollment().getCreatedAt();
        return createdAt != null ? createdAt.toLocalDate() : null;
    }

    private LocalDate endBySessionCount(EnrollmentContext context, LocalDate start) {
        Integer purchased = context.purchasedSessions();
        if (purchased == null || start == null) return null;
        return dateOfSessionNumber(context.slot(), start, purchased).orElse(null);
    }

    private LocalDate firstNonNull(LocalDate... dates) {
        for (LocalDate date : dates) {
            if (date != null) return date;
        }
        return null;
    }
}
