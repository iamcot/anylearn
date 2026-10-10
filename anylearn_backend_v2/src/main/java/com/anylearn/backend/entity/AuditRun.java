package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_runs")
@Getter @Setter
public class AuditRun {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ran_at", nullable = false)
    private LocalDateTime ranAt;

    @Column(name = "triggered_by", nullable = false, length = 20)
    private String triggeredBy;

    @Column(name = "discrepancy_count", nullable = false)
    private int discrepancyCount;

    @Column(nullable = false, length = 10)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
