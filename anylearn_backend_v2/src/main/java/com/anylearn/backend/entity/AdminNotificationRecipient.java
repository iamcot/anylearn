package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "admin_notification_recipients")
@Getter @Setter
public class AdminNotificationRecipient {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "added_by")
    private Long addedBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
