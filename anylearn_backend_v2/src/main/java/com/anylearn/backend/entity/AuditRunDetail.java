package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "audit_run_details")
@Getter @Setter
public class AuditRunDetail {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_id", nullable = false)
    private Long runId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "wallet_c", nullable = false)
    private long walletC;

    @Column(name = "tx_sum", nullable = false)
    private long txSum;

    @Column(nullable = false)
    private long delta;
}
