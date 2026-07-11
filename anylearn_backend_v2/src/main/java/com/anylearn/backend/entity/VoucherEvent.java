package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "voucher_events")
@Getter @Setter
public class VoucherEvent {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private Byte status;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private Integer trigger;

    @Column(nullable = false)
    private String targets;

    @Column(nullable = false)
    private Integer qtt;

    @Column(name = "notif_template", columnDefinition = "TEXT")
    private String notifTemplate;

    @Column(name = "email_template", columnDefinition = "TEXT")
    private String emailTemplate;

    @Column(name = "commission_rate")
    private String commissionRate;

    @Column(name = "ref_user_id")
    private Long refUserId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
