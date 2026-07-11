package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Getter @Setter
public class Order {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Long amount;

    @Column(nullable = false)
    private String status;

    @Column(name = "delivery_name")
    private String deliveryName;

    @Column(name = "delivery_address")
    private String deliveryAddress;

    @Column(name = "delivery_phone")
    private String deliveryPhone;

    private String payment;

    @Column(name = "sale_id")
    private Long saleId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
