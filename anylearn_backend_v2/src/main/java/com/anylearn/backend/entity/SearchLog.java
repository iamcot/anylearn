package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "search_logs")
@Getter @Setter
public class SearchLog {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ref;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "session_key")
    private String sessionKey;

    private String keyword;

    @Column(name = "keyword_normalized")
    private String keywordNormalized;

    private String mode;
    private String category;

    @Column(name = "age_filter")
    private String ageFilter;

    @Column(name = "price_filter")
    private String priceFilter;

    @Column(name = "location_filter")
    private String locationFilter;

    @Column(name = "format_filter")
    private String formatFilter;

    private String audience;

    @Column(name = "learner_age")
    private Integer learnerAge;

    @Column(name = "result_count", nullable = false)
    private Integer resultCount = 0;

    @Column(name = "clicked_item_id")
    private Long clickedItemId;

    @Column(name = "clicked_at")
    private LocalDateTime clickedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
