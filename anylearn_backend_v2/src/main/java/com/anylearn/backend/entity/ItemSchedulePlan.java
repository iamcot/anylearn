package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "item_schedule_plans")
@Getter @Setter
public class ItemSchedulePlan {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(name = "user_location_id")
    private Long userLocationId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String weekdays;

    @Column(name = "date_start", nullable = false)
    private String dateStart;

    @Column(name = "date_end")
    private String dateEnd;

    @Column(name = "time_start", nullable = false)
    private String timeStart;

    @Column(name = "time_end")
    private String timeEnd;

    @Column(columnDefinition = "TEXT")
    private String info;

    @Column(nullable = false)
    private Byte status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
