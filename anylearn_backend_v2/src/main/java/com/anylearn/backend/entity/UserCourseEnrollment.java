package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_course_enrollments")
@Getter @Setter
public class UserCourseEnrollment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "schedule_id")
    private Long scheduleId;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "billing_period")
    private String billingPeriod;

    @Column(nullable = false)
    private String status = "pending";

    @Column(name = "remind_sent_at")
    private LocalDateTime remindSentAt;

    @Column(name = "remind_count", nullable = false)
    private Integer remindCount = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
