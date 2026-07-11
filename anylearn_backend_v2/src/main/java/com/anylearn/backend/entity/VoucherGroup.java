package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "voucher_groups")
@Getter @Setter
public class VoucherGroup {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String type;

    @Column(name = "generate_type", nullable = false)
    private String generateType;

    private String prefix;

    @Column(nullable = false)
    private Integer qtt;

    @Column(nullable = false)
    private String value;

    @Column(nullable = false)
    private Integer status;

    @Column(columnDefinition = "TEXT")
    private String ext;

    @Column(name = "rule_min")
    private Integer ruleMin;

    @Column(name = "rule_max")
    private String ruleMax;

    @Column(nullable = false, columnDefinition = "tinyint unsigned")
    private Integer length;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
