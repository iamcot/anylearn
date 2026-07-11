package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "knowledge_topic_category_links")
@Getter @Setter
public class KnowledgeTopicCategoryLink {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "knowledge_topic_id", nullable = false)
    private Long knowledgeTopicId;

    @Column(name = "knowledge_category_id", nullable = false)
    private Long knowledgeCategoryId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
