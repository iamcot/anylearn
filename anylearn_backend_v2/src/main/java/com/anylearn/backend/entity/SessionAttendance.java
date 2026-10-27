package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "session_attendances")
@Getter @Setter
public class SessionAttendance {

    public static final String STATUS_ATTENDED = "attended";
    public static final String SOURCE_MANUAL = "manual";
    public static final String SOURCE_JOIN = "join";
    public static final String SOURCE_ADMIN = "admin";

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "learner_id", nullable = false)
    private Long learnerId;

    @Column(name = "item_schedule_id", nullable = false)
    private Long itemScheduleId;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(nullable = false)
    private String status = STATUS_ATTENDED;

    @Column(nullable = false)
    private String source;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
