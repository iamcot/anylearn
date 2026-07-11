package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_banks")
@Getter @Setter
public class UserBank {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "token_num", nullable = false)
    private String tokenNum;

    @Column(name = "token_exp")
    private String tokenExp;

    @Column(name = "card_type")
    private String cardType;

    @Column(name = "card_uid")
    private String cardUid;

    @Column(nullable = false)
    private Byte status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
