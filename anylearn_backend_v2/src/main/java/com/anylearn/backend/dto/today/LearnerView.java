package com.anylearn.backend.dto.today;

public record LearnerView(Long id, String name, boolean self, boolean hasEnrollment, int feeDueCount) {
}
