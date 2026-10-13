package com.anylearn.backend.service.today;

import com.anylearn.backend.dto.today.SessionView;
import com.anylearn.backend.dto.today.WeekDayView;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.entity.UserLocation;
import com.anylearn.backend.entity.ScheduleRequest;
import com.anylearn.backend.repository.ScheduleRequestRepository;
import com.anylearn.backend.repository.SessionAttendanceRepository;
import com.anylearn.backend.repository.UserLocationRepository;
import com.anylearn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Component
@RequiredArgsConstructor
public class SessionViews {

    private static final int DAYS_IN_WEEK = 7;

    private final UserRepository users;
    private final UserLocationRepository locations;
    private final SessionAttendanceRepository attendances;
    private final ScheduleRequestRepository requests;
    private final SessionSchedule schedule;

    public SessionViewBuilder builderFor(List<EnrollmentContext> contexts, Long learnerId,
                                         DateRange window, LocalDateTime now) {
        List<EnrollmentContext> scheduled = contexts.stream().filter(EnrollmentContext::hasSchedule).toList();
        return new SessionViewBuilder(
                byScheduleId(scheduled), teacherNames(scheduled), locationsOf(scheduled),
                attendedKeys(learnerId, window), pendingRequestTypes(learnerId), schedule, now);
    }

    public List<WeekDayView> weekStrip(LocalDate weekStart, List<Session> sessions, SessionViewBuilder builder) {
        return IntStream.range(0, DAYS_IN_WEEK)
                .mapToObj(weekStart::plusDays)
                .map(date -> weekDay(date, sessions, builder))
                .toList();
    }

    private WeekDayView weekDay(LocalDate date, List<Session> sessions, SessionViewBuilder builder) {
        List<SessionView> dayViews = sessions.stream()
                .filter(session -> session.date().equals(date))
                .sorted(Comparator.comparing(Session::startAt))
                .map(builder::of)
                .toList();
        boolean hasExtra = dayViews.stream().anyMatch(view -> view.mode() == SessionMode.EXTRA);
        boolean hasClass = dayViews.stream().anyMatch(view -> view.mode() != SessionMode.EXTRA);
        return new WeekDayView(date, hasClass, hasExtra, dayViews);
    }

    private Map<Long, EnrollmentContext> byScheduleId(List<EnrollmentContext> scheduled) {
        return scheduled.stream().collect(Collectors.toMap(
                context -> context.schedule().getId(), Function.identity(), (first, second) -> first));
    }

    private Map<Long, String> teacherNames(List<EnrollmentContext> scheduled) {
        List<Long> teacherIds = scheduled.stream().map(context -> context.item().getUserId())
                .filter(Objects::nonNull).distinct().toList();
        return users.findAllById(teacherIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user.getName() != null ? user.getName() : ""));
    }

    private Map<Long, UserLocation> locationsOf(List<EnrollmentContext> scheduled) {
        List<Long> ids = scheduled.stream().map(SessionViewBuilder::locationIdOf)
                .filter(Objects::nonNull).distinct().toList();
        return locations.findAllById(ids).stream().collect(Collectors.toMap(UserLocation::getId, Function.identity()));
    }

    private Map<String, String> pendingRequestTypes(Long learnerId) {
        return requests.findByLearnerIdAndStatus(learnerId, ScheduleRequest.STATUS_PENDING).stream()
                .collect(Collectors.toMap(
                        request -> new SessionKey(request.getItemScheduleId(), request.getSessionDate()).toString(),
                        ScheduleRequest::getType, (first, second) -> first));
    }

    private Set<String> attendedKeys(Long learnerId, DateRange window) {
        return attendances.findByLearnerIdAndSessionDateBetween(learnerId, window.from(), window.to()).stream()
                .map(attendance -> new SessionKey(attendance.getItemScheduleId(), attendance.getSessionDate()).toString())
                .collect(Collectors.toSet());
    }
}
