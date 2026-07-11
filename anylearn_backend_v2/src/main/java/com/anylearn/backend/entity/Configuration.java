package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "configurations")
@Getter @Setter
public class Configuration {

    @Id
    @Column(name = "`key`")
    private String key;

    @Column(columnDefinition = "LONGTEXT")
    private String value;

    @Column(nullable = false)
    private String type;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
