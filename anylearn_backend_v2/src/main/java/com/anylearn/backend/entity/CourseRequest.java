package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Set;

// A visitor asks anyLEARN to find a course nothing in the catalogue matched.
@Entity
@Table(name = "course_requests")
@Getter @Setter
public class CourseRequest {

    public static final String STATUS_NEW = "new";
    public static final String STATUS_CONTACTING = "contacting";
    public static final String STATUS_MATCHED = "matched";
    public static final String STATUS_NO_PARTNER = "no_partner";
    public static final String STATUS_CLOSED = "closed";
    public static final Set<String> STATUSES =
            Set.of(STATUS_NEW, STATUS_CONTACTING, STATUS_MATCHED, STATUS_NO_PARTNER, STATUS_CLOSED);

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "contact_name")
    private String contactName;

    @Column(name = "contact_phone", nullable = false)
    private String contactPhone;

    @Column(nullable = false)
    private String subject;

    @Column(name = "subject_normalized", nullable = false)
    private String subjectNormalized;

    @Column(name = "learner_age")
    private Integer learnerAge;

    @Column(name = "province_code")
    private String provinceCode;

    @Column(name = "district_text")
    private String districtText;

    @Column(name = "budget_max")
    private Long budgetMax;

    @Column(name = "preferred_time")
    private String preferredTime;

    private String mode;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "source_ref")
    private String sourceRef;

    @Column(nullable = false)
    private String status = STATUS_NEW;

    @Column(name = "matched_item_id")
    private Long matchedItemId;

    @Column(name = "admin_note")
    private String adminNote;

    @Column(name = "handled_by")
    private Long handledBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
