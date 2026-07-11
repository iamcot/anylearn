package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "item_video_lessons")
@Getter @Setter
public class ItemVideoLesson {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(name = "item_video_chapter_id", nullable = false)
    private Long itemVideoChapterId;

    @Column(name = "lesson_no", nullable = false)
    private Integer lessonNo;

    @Column(nullable = false)
    private String title;

    private String description;
    private String length;

    @Column(nullable = false)
    private Byte status;

    @Column(name = "is_free", nullable = false)
    private Byte isFree;

    @Column(nullable = false)
    private String type;

    @Column(name = "type_value", columnDefinition = "TEXT")
    private String typeValue;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
