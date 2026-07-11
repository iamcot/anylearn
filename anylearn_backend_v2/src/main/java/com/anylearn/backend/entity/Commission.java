package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "commissions")
@Getter @Setter
public class Commission {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(name = "ref_user_id", nullable = false)
    private Long refUserId;

    @Column(nullable = false)
    private String content;

    @Column(nullable = false)
    private Long amount;

    @Column(name = "ref_amount", nullable = false)
    private Long refAmount;

    @Column(nullable = false)
    private Integer status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
