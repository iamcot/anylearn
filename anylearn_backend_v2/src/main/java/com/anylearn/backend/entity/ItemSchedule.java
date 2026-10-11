package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "item_schedules")
@Getter @Setter
public class ItemSchedule {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    private String title;

    @Column(name = "schedule_type", nullable = false)
    private String scheduleType;

    @Column(name = "event_date")
    private LocalDate eventDate;

    private String weekdays;

    @Column(name = "time_start")
    private String timeStart;

    @Column(name = "time_end")
    private String timeEnd;

    @Column(name = "date_start")
    private LocalDate dateStart;

    @Column(name = "date_end")
    private LocalDate dateEnd;

    @Column(name = "duration_value")
    private Integer durationValue;

    @Column(name = "duration_unit")
    private String durationUnit;

    @Column(name = "location_note")
    private String locationNote;

    @Column(nullable = false)
    private Byte status = 1;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
