package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_events")
@Getter @Setter @NoArgsConstructor
public class UserEvent {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "visitor_id")
    private Long visitorId;

    @Column(name = "type", nullable = false, length = 20)
    private String type;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public UserEvent(Long userId, Long visitorId, String type) {
        this.userId = userId;
        this.visitorId = visitorId;
        this.type = type;
        this.createdAt = LocalDateTime.now();
    }
}
