package com.anylearn.backend.dto.today;

import com.anylearn.backend.service.today.SessionMode;

import java.time.LocalDateTime;

public record SessionView(String key, Long itemId, String title, SessionMode mode,
                          LocalDateTime startAt, LocalDateTime endAt, String teacherName,
                          boolean attended, String pendingRequest, LocalDateTime joinOpensAt, boolean canJoin,
                          LocationView location, String gatherTime, String bringItems) {
}
