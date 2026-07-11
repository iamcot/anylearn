package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Getter @Setter
public class Transaction {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "ref_user_id")
    private Long refUserId;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private Long amount;

    @Column(name = "ref_amount")
    private Long refAmount;

    @Column(name = "pay_method")
    private String payMethod;

    @Column(name = "pay_info", columnDefinition = "TEXT")
    private String payInfo;

    @Column(name = "order_id")
    private Long orderId;

    private String content;

    @Column(nullable = false)
    private Integer status;

    @Column(name = "ref_id")
    private Integer refId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
