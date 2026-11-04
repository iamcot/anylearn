package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "articles")
@Getter @Setter
public class Article {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    private Long category;
    private String type;
    private String title;
    private String image;
    private String video;

    @Column(name = "short_content", columnDefinition = "TEXT")
    private String shortContent;

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Column(nullable = false)
    private Long view;

    @Column(name = "`like`", nullable = false)
    private Long like;

    @Column(nullable = false)
    private Byte status;

    @Column(name = "is_hot", nullable = false)
    private Byte isHot;

    private String tags;

    /** Voucher group people can save from this article's banner (null = none). */
    @Column(name = "voucher_group_id")
    private Long voucherGroupId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
