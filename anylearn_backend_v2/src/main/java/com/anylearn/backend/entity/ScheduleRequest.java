package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "schedule_requests")
@Getter @Setter
public class ScheduleRequest {

    public static final String TYPE_LEAVE = "leave";
    public static final String TYPE_RESCHEDULE = "reschedule";
    public static final String TYPE_MAKEUP = "makeup";

    public static final String STATUS_PENDING = "pending";
    public static final String STATUS_APPROVED = "approved";
    public static final String STATUS_REJECTED = "rejected";

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "learner_id", nullable = false)
    private Long learnerId;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "enrollment_id", nullable = false)
    private Long enrollmentId;

    @Column(name = "item_schedule_id", nullable = false)
    private Long itemScheduleId;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(nullable = false)
    private String type;

    private String note;

    @Column(nullable = false)
    private String status = STATUS_PENDING;

    @Column(name = "admin_note")
    private String adminNote;

    @Column(name = "handled_by")
    private Long handledBy;

    @Column(name = "handled_at")
    private LocalDateTime handledAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
