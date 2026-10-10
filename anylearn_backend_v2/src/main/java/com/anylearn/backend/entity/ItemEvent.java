package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "item_events")
@Getter @Setter @NoArgsConstructor
public class ItemEvent {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "type", nullable = false, length = 20)
    private String type;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public ItemEvent(Long itemId, Long userId, String type) {
        this.itemId = itemId;
        this.userId = userId;
        this.type = type;
        this.createdAt = LocalDateTime.now();
    }
}
