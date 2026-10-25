package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "order_followups")
@Getter @Setter
public class OrderFollowup {

    public static final String REMIND = "remind";
    public static final String EXPIRE = "expire";

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(nullable = false)
    private String kind;

    @Column(nullable = false)
    private Integer stage;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
