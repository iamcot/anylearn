package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

// One browser or installed PWA that agreed to receive notifications. The endpoint is too long for a unique index,
// so its sha256 (endpoint_hash) is the key.
@Entity
@Table(name = "push_subscriptions")
@Getter @Setter
public class PushSubscription {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 1000)
    private String endpoint;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "endpoint_hash", nullable = false, length = 64)
    private String endpointHash;

    @Column(nullable = false)
    private String p256dh;

    @Column(nullable = false)
    private String auth;

    private String platform;

    @Column(name = "is_standalone", nullable = false)
    private Boolean standalone = false;

    @Column(name = "failure_count", nullable = false)
    private Integer failureCount = 0;

    @Column(name = "last_success_at")
    private LocalDateTime lastSuccessAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
