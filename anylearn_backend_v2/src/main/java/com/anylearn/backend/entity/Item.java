package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "items")
@Getter @Setter
public class Item {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "series_id")
    private Long seriesId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(length = 50)
    private String subtype;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "item_category_id", nullable = false)
    private Integer itemCategoryId;

    @Column(columnDefinition = "TEXT")
    private String image;

    @Column(name = "short_content", columnDefinition = "TEXT")
    private String shortContent;

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Column(nullable = false)
    private Long price;

    @Column(name = "org_price")
    private Long orgPrice;

    @Column(name = "commission_rate")
    private Double commissionRate;

    @Column(name = "company_commission")
    private String companyCommission;

    @Column(name = "got_bonus", nullable = false)
    private Byte gotBonus;

    @Column(name = "date_start", nullable = false)
    private LocalDate dateStart;

    @Column(name = "time_start")
    private String timeStart;

    @Column(name = "date_end")
    private LocalDate dateEnd;

    @Column(name = "time_end")
    private String timeEnd;

    @Column(name = "location_type")
    private String locationType;

    private String location;

    @Column(name = "is_hot", nullable = false)
    private Byte isHot;

    @Column(nullable = false)
    private Byte status;

    @Column(name = "user_status", nullable = false)
    private Byte userStatus;

    @Column(name = "boost_score", nullable = false)
    private Integer boostScore;

    @Column(name = "popularity_score", nullable = false)
    private Integer popularityScore = 0;

    @Column(name = "seo_title", columnDefinition = "TEXT")
    private String seoTitle;

    @Column(name = "seo_url")
    private String seoUrl;

    @Column(name = "seo_desc", columnDefinition = "TEXT")
    private String seoDesc;

    @Column(name = "is_test", nullable = false)
    private Byte isTest;

    private String tags;

    @Column(name = "nolimit_time", nullable = false)
    private String nolimitTime;

    @Column(name = "item_id")
    private Long itemId;

    @Column(name = "user_location_id")
    private Long userLocationId;

    @Column(name = "sale_id")
    private Long saleId;

    @Column(name = "is_paymentfee")
    private Integer isPaymentfee;

    @Column(name = "ages_min")
    private Byte agesMin;

    @Column(name = "ages_max")
    private Byte agesMax;

    private Integer seats;
    private String mailcontent;

    @Column(name = "allow_re_register", nullable = false)
    private Byte allowReRegister;

    @Column(name = "cycle_type")
    private String cycleType;

    @Column(name = "cycle_amount")
    private Integer cycleAmount;

    @Column(name = "activiy_trial")
    private Byte activiyTrial;

    @Column(name = "activiy_test")
    private Byte activiyTest;

    @Column(name = "activiy_visit")
    private Byte activiyVisit;

    @Column(name = "activation_support")
    private String activationSupport;

    @Column(name = "product_id")
    private String productId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
