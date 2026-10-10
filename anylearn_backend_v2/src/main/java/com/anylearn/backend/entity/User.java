package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter
public class User {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(name = "first_name")
    private String firstName;

    private String email;

    @Column(nullable = false, unique = true)
    private String phone;

    @Column(nullable = false, unique = true)
    private String refcode;

    @Column(nullable = false)
    private String password;

    @Column(name = "api_token", unique = true)
    private String apiToken;

    @Column(name = "notif_token")
    private String notifToken;

    @Column(nullable = false, length = 20)
    private String role;

    @Column(nullable = false)
    private Byte status;

    @Column(name = "is_signed", nullable = false)
    private Byte isSigned;

    @Column(name = "user_category_id", nullable = false)
    private Integer userCategoryId;

    @Column(name = "package_id", nullable = false)
    private Integer packageId;

    @Column(nullable = false)
    private Integer expire;

    @Column(name = "wallet_m", nullable = false)
    private Long walletM;

    @Column(name = "wallet_c", nullable = false)
    private Long walletC;

    @Column(name = "commission_rate", nullable = false)
    private Double commissionRate;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "sale_id")
    private Long saleId;

    @Column(name = "is_hot", nullable = false)
    private Byte isHot;

    @Column(name = "boost_score")
    private Integer boostScore;

    @Column(name = "popularity_score", nullable = false)
    private Integer popularityScore = 0;

    @Column(columnDefinition = "TEXT")
    private String image;

    @Column(columnDefinition = "TEXT")
    private String banner;

    @Column(columnDefinition = "TEXT")
    private String introduce;

    @Column(name = "full_content", columnDefinition = "LONGTEXT")
    private String fullContent;

    private String title;
    private String sex;
    private java.time.LocalDate dob;

    @Column(columnDefinition = "TEXT")
    private String address;

    private String country;

    @Column(name = "num_friends", nullable = false)
    private Integer numFriends;

    @Column(name = "email_verified_at")
    private LocalDateTime emailVerifiedAt;

    @Column(name = "remember_token")
    private String rememberToken;

    @Column(name = "is_test", nullable = false)
    private Byte isTest;

    @Column(name = "3rd_id")
    private String thirdId;

    @Column(name = "3rd_token", unique = true)
    private String thirdToken;

    @Column(name = "3rd_type")
    private String thirdType;

    @Column(name = "is_child", nullable = false)
    private Byte isChild;

    @Column(name = "cert_id")
    private String certId;

    @Column(name = "cert_exp")
    private java.time.LocalDate certExp;

    @Column(name = "cert_location", columnDefinition = "TEXT")
    private String certLocation;

    @Column(name = "omicall_id")
    private String omicallId;

    @Column(name = "omicall_pwd")
    private String omicallPwd;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "is_registered", nullable = false)
    private Byte isRegistered;

    private String source;
    private String language;

    @Column(name = "business_certificate")
    private String businessCertificate;

    @Column(name = "first_issued_date")
    private java.time.LocalDate firstIssuedDate;

    @Column(name = "issued_by")
    private String issuedBy;

    @Column(name = "headquarters_address")
    private String headquartersAddress;

    @Column(columnDefinition = "TEXT")
    private String modules;

    @Column(name = "update_doc", nullable = false)
    private Byte updateDoc;

    @Column(name = "sale_priority", nullable = false, columnDefinition = "tinyint unsigned")
    private Integer salePriority;

    @Column(name = "get_ref_seller", nullable = false)
    private Boolean getRefSeller;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
