package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "provinces")
@Getter @Setter
public class Province {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String slug;

    @Column(nullable = false)
    private String type;

    @Column(name = "name_with_type", nullable = false)
    private String nameWithType;

    @Column(nullable = false)
    private String code;
}
