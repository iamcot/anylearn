package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "wards")
@Getter @Setter
public class Ward {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String slug;

    @Column(name = "name_with_type", nullable = false)
    private String nameWithType;

    @Column(nullable = false)
    private String path;

    @Column(name = "path_with_type", nullable = false)
    private String pathWithType;

    @Column(nullable = false)
    private String code;

    @Column(name = "parent_code", nullable = false)
    private String parentCode;
}
