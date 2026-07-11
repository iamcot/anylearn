package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_details")
@Getter @Setter
public class OrderDetail {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(name = "unit_price", nullable = false)
    private Long unitPrice;

    @Column(name = "paid_price", nullable = false)
    private Long paidPrice;

    @Column(nullable = false)
    private Integer quanity;

    @Column(nullable = false)
    private String status;

    @Column(name = "item_schedule_plan_id")
    private Long itemSchedulePlanId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
