package com.anylearn.backend.service.today;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public record SessionKey(Long scheduleId, LocalDate date) {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.BASIC_ISO_DATE;
    private static final String SEPARATOR = "_";

    public static SessionKey parse(String value) {
        String[] parts = value == null ? new String[0] : value.split(SEPARATOR);
        if (parts.length != 2) {
            throw new IllegalArgumentException("Mã buổi học không hợp lệ");
        }
        try {
            return new SessionKey(Long.parseLong(parts[0]), LocalDate.parse(parts[1], DATE_FORMAT));
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("Mã buổi học không hợp lệ");
        }
    }

    @Override
    public String toString() {
        return scheduleId + SEPARATOR + date.format(DATE_FORMAT);
    }
}
