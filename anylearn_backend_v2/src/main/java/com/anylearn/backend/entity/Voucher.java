package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "vouchers")
@Getter @Setter
public class Voucher {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "voucher_group_id", nullable = false)
    private Long voucherGroupId;

    @Column(nullable = false, unique = true)
    private String voucher;

    @Column(nullable = false)
    private Integer amount;

    @Column(nullable = false)
    private String value;

    @Column(nullable = false)
    private Byte status;

    @Column(nullable = false)
    private Integer expired;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
