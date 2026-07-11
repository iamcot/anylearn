package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "contracts")
@Getter @Setter
public class Contract {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Byte status;

    @Column(nullable = false)
    private String type;

    @Column(name = "cert_id")
    private String certId;

    @Column(name = "cert_date")
    private LocalDate certDate;

    @Column(name = "cert_place")
    private String certPlace;

    private String email;
    private String dob;

    @Column(name = "dob_place")
    private String dobPlace;

    private String tax;
    private String ref;

    @Column(name = "ref_title")
    private String refTitle;

    private String address;

    @Column(nullable = false)
    private Double commission;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "bank_branch")
    private String bankBranch;

    @Column(name = "bank_no")
    private String bankNo;

    @Column(name = "bank_account")
    private String bankAccount;

    private String signed;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
