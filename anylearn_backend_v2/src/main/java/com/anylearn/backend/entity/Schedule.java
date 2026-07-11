package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "schedules")
@Getter @Setter
public class Schedule {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "time_start", nullable = false)
    private String timeStart;

    @Column(name = "time_end")
    private String timeEnd;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private Byte status;

    @Column(name = "class_plan_id")
    private Long classPlanId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
