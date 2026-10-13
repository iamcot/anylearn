package com.anylearn.backend.service.today;

import java.time.LocalDate;
import java.util.List;

public record DateRange(LocalDate from, LocalDate to) {

    public static DateRange of(LocalDate from, LocalDate to) {
        return new DateRange(from, to);
    }

    public DateRange intersect(DateRange other) {
        return new DateRange(laterOf(from, other.from), earlierOf(to, other.to));
    }

    public boolean isEmpty() {
        return from != null && to != null && from.isAfter(to);
    }

    public List<LocalDate> dates() {
        if (from == null || to == null) {
            throw new IllegalStateException("Cần khoảng ngày có đủ hai đầu");
        }
        return isEmpty() ? List.of() : from.datesUntil(to.plusDays(1)).toList();
    }

    private static LocalDate laterOf(LocalDate a, LocalDate b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.isAfter(b) ? a : b;
    }

    private static LocalDate earlierOf(LocalDate a, LocalDate b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.isBefore(b) ? a : b;
    }
}
