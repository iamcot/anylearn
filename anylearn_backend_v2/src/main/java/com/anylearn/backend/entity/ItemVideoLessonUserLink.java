package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "item_video_lesson_user_links")
@Getter @Setter
public class ItemVideoLessonUserLink {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_video_lesson_id", nullable = false)
    private Long itemVideoLessonId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    private String checkpoint;

    @Column(nullable = false)
    private Byte complete;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
