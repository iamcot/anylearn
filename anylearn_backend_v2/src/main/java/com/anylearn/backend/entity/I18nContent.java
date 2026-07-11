package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "i18n_contents")
@Getter @Setter
public class I18nContent {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String locale;

    @Column(nullable = false)
    private String tbl;

    @Column(name = "content_id", nullable = false)
    private Long contentId;

    @Column(nullable = false)
    private String col;

    @Column(name = "i18n_content", nullable = false, columnDefinition = "LONGTEXT")
    private String i18nContent;

    @Column(nullable = false)
    private Byte status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
