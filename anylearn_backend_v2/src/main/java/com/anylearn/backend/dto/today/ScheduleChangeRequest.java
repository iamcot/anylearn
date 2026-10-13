package com.anylearn.backend.dto.today;

public record ScheduleChangeRequest(Long learnerId, String sessionKey, String type, String note) {
}
