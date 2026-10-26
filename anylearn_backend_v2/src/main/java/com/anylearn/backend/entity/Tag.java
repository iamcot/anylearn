package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/** One entry of the tag dictionary. Items point at it through `item_tags`. */
@Entity
@Table(name = "tags")
@Getter @Setter
public class Tag {

    public static final byte STATUS_ACTIVE = 1;
    public static final byte STATUS_HIDDEN = 0;

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "tag_group", nullable = false)
    private String tagGroup = TagGroups.OTHER;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(nullable = false)
    private Byte status = STATUS_ACTIVE;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
