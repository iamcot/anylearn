package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "knowledges")
@Getter @Setter
public class Knowledge {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "knowledge_category_id", nullable = false)
    private Long knowledgeCategoryId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String url;

    private String description;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "content_bot", columnDefinition = "TEXT")
    private String contentBot;

    @Column(name = "thumb_up", nullable = false)
    private Integer thumbUp;

    @Column(name = "thumb_down", nullable = false)
    private Integer thumbDown;

    @Column(nullable = false)
    private Byte status;

    @Column(nullable = false)
    private Long view;

    @Column(name = "is_top_question", nullable = false)
    private Byte isTopQuestion;

    @Column(nullable = false)
    private String type;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
