package com.anylearn.backend.service.today;

import com.anylearn.backend.dto.today.LocationView;
import com.anylearn.backend.dto.today.SessionView;
import com.anylearn.backend.entity.UserLocation;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

public class SessionViewBuilder {

    private final Map<Long, EnrollmentContext> contextsByScheduleId;
    private final Map<Long, String> teacherNames;
    private final Map<Long, UserLocation> locations;
    private final Set<String> attendedKeys;
    private final Map<String, String> pendingRequestTypes;
    private final SessionSchedule schedule;
    private final LocalDateTime now;

    SessionViewBuilder(Map<Long, EnrollmentContext> contextsByScheduleId, Map<Long, String> teacherNames,
                       Map<Long, UserLocation> locations, Set<String> attendedKeys,
                       Map<String, String> pendingRequestTypes,
                       SessionSchedule schedule, LocalDateTime now) {
        this.contextsByScheduleId = contextsByScheduleId;
        this.teacherNames = teacherNames;
        this.locations = locations;
        this.attendedKeys = attendedKeys;
        this.pendingRequestTypes = pendingRequestTypes;
        this.schedule = schedule;
        this.now = now;
    }

    public SessionView of(Session session) {
        EnrollmentContext context = contextsByScheduleId.get(session.scheduleId());
        SessionMode mode = context.mode();
        boolean online = mode == SessionMode.ONLINE;
        String key = session.key().toString();
        return new SessionView(key, context.item().getId(), context.item().getTitle(), mode,
                session.startAt(), session.endAt(), teacherNames.get(context.item().getUserId()),
                attendedKeys.contains(key),
                pendingRequestTypes.get(key),
                online ? schedule.joinOpensAt(session) : null,
                online && schedule.canJoin(session, now),
                online ? null : locationOf(context),
                context.schedule().getGatherTime(), context.schedule().getBringItems());
    }

    private LocationView locationOf(EnrollmentContext context) {
        String roomNote = context.schedule().getLocationNote();
        UserLocation location = locations.get(locationIdOf(context));
        if (location != null) {
            return new LocationView(location.getTitle(), location.getAddress(), roomNote,
                    parseCoordinate(location.getLatitude()), parseCoordinate(location.getLongitude()));
        }
        String freeTextAddress = context.item().getLocation();
        if (freeTextAddress == null || freeTextAddress.isBlank()) return null;
        return new LocationView(null, freeTextAddress, roomNote, null, null);
    }

    static Long locationIdOf(EnrollmentContext context) {
        Long scheduleLocation = context.schedule().getUserLocationId();
        return scheduleLocation != null ? scheduleLocation : context.item().getUserLocationId();
    }

    private Double parseCoordinate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Double.valueOf(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
