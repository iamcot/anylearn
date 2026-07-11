package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "zns_contents")
@Getter @Setter
public class ZnsContent {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String phone;

    @Column(name = "template_id", nullable = false)
    private String templateId;

    @Column(name = "template_data", nullable = false, columnDefinition = "TEXT")
    private String templateData;

    @Column(name = "tracking_id", nullable = false)
    private String trackingId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
