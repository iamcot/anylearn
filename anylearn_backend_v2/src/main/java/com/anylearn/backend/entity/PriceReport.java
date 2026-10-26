package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Set;

// A visitor reports a lower price for a course somewhere else, against the "equal or cheaper than the school" promise.
@Entity
@Table(name = "price_reports")
@Getter @Setter
public class PriceReport {

    public static final String STATUS_NEW = "new";
    public static final String STATUS_CHECKING = "checking";
    public static final String STATUS_FIXED = "fixed";
    public static final String STATUS_REJECTED = "rejected";
    public static final Set<String> STATUSES = Set.of(STATUS_NEW, STATUS_CHECKING, STATUS_FIXED, STATUS_REJECTED);

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_id")
    private Long itemId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "seen_price")
    private Long seenPrice;

    @Column(name = "seen_place")
    private String seenPlace;

    private String note;

    @Column(nullable = false)
    private String status = STATUS_NEW;

    @Column(name = "admin_note")
    private String adminNote;

    @Column(name = "handled_by")
    private Long handledBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
