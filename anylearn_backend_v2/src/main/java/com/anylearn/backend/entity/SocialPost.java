package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "social_posts")
@Getter @Setter
public class SocialPost {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String type;

    @Column(name = "ref_id")
    private Long refId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "post_id")
    private Long postId;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String image;

    @Column(nullable = false)
    private String day;

    @Column(nullable = false)
    private Byte status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
