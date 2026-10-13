package com.anylearn.backend.service.today;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record Session(Long scheduleId, LocalDate date, LocalTime start, LocalTime end) {

    static final Duration DEFAULT_DURATION = Duration.ofHours(2);

    public SessionKey key() {
        return new SessionKey(scheduleId, date);
    }

    public LocalDateTime startAt() {
        return date.atTime(start != null ? start : LocalTime.MIDNIGHT);
    }

    public LocalDateTime endAt() {
        return end != null ? date.atTime(end) : startAt().plus(DEFAULT_DURATION);
    }

    public boolean hasEndedBy(LocalDateTime moment) {
        return !endAt().isAfter(moment);
    }
}
