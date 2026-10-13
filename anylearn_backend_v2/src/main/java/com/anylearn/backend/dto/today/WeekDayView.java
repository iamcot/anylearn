package com.anylearn.backend.dto.today;

import java.time.LocalDate;
import java.util.List;

public record WeekDayView(LocalDate date, boolean hasClass, boolean hasExtra, List<SessionView> sessions) {
}
