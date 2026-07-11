package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter @Setter
public class Notification {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String type;

    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private String route;

    @Column(name = "extra_content", columnDefinition = "TEXT")
    private String extraContent;

    @Column(name = "is_send", nullable = false)
    private Byte isSend;

    private LocalDateTime send;
    private LocalDateTime read;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
