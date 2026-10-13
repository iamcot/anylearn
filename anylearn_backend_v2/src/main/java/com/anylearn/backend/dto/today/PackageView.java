package com.anylearn.backend.dto.today;

import java.time.LocalDate;

public record PackageView(Long enrollmentId, Long itemId, String title, int used, int total,
                          int remaining, LocalDate endDate, boolean showRenew) {
}
