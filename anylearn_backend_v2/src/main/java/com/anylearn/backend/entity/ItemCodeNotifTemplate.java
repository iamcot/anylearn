package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "item_codes_notif_templates")
@Getter @Setter
public class ItemCodeNotifTemplate {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email_template", columnDefinition = "TEXT")
    private String emailTemplate;

    @Column(name = "notif_template", columnDefinition = "TEXT")
    private String notifTemplate;

    @Column(name = "item_id")
    private Long itemId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
