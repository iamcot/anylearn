package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "class_plans")
@Getter @Setter
public class ClassPlan {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    private String title;
    private LocalDate start;

    @Column(name = "user_location_id")
    private Long userLocationId;

    @Column(name = "extra_info")
    private String extraInfo;

    @Column(nullable = false)
    private Byte status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
