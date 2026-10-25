package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "bank_webhook_events")
@Getter @Setter
public class BankWebhookEvent {

    public static final String PAID = "paid";
    public static final String IGNORED = "ignored";
    public static final String UNMATCHED = "unmatched";
    public static final String NEEDS_REVIEW = "needs_review";
    public static final String MISMATCH = "mismatch";

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String provider;

    @Column(name = "provider_txn_id", nullable = false)
    private String providerTxnId;

    @Column(nullable = false)
    private String direction;

    @Column(nullable = false)
    private Long amount;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "account_no")
    private String accountNo;

    @Column(name = "transferred_at", nullable = false)
    private LocalDateTime transferredAt;

    @Column(columnDefinition = "TEXT")
    private String raw;

    @Column(name = "match_status", nullable = false)
    private String matchStatus;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;
}
