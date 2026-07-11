package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "spms")
@Getter @Setter
public class Spm {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "spm_key", nullable = false)
    private String spmKey;

    @Column(nullable = false)
    private String event;

    @Column(name = "session_id", nullable = false)
    private String sessionId;

    @Column(nullable = false)
    private String day;

    @Column(name = "user_id")
    private String userId;

    @Column(nullable = false)
    private String spma;

    @Column(nullable = false)
    private String spmb;

    @Column(nullable = false)
    private String spmc;

    @Column(nullable = false)
    private String spmd;

    @Column(name = "spm_pre")
    private String spmPre;

    @Column(name = "p_url")
    private String pUrl;

    @Column(name = "p_ref")
    private String pRef;

    @Column(name = "p_title")
    private String pTitle;

    @Column(name = "p_meta_desc", columnDefinition = "TEXT")
    private String pMetaDesc;

    @Column(name = "p_meta_robots")
    private String pMetaRobots;

    @Column(name = "p_canonical")
    private String pCanonical;

    @Column(name = "p_lang")
    private String pLang;

    private String os;
    private String ip;
    private String country;
    private String browser;
    private String screen;

    @Column(name = "user_type")
    private String userType;

    private String logfrom;

    @Column(columnDefinition = "TEXT")
    private String extra;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
