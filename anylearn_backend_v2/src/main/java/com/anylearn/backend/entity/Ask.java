package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "asks")
@Getter @Setter
public class Ask {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "ask_id")
    private Long askId;

    @Column(nullable = false)
    private String type;

    @Column(name = "is_selected_answer", nullable = false)
    private Byte isSelectedAnswer;

    @Column(name = "like", nullable = false)
    private Integer like;

    @Column(name = "unlike", nullable = false)
    private Integer unlike;

    @Column(name = "is_pro_answer", nullable = false)
    private Byte isProAnswer;

    @Column(nullable = false)
    private Byte status;

    private String title;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
