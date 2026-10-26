package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_locations")
@Getter @Setter
public class UserLocation {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String title;

    @Column(name = "ward_code", length = 10)
    private String wardCode;

    @Column(name = "district_code", length = 10)
    private String districtCode;

    @Column(name = "province_code", length = 10)
    private String provinceCode;

    @Column(name = "ward_path")
    private String wardPath;

    /** Old text columns from the portal; the numeric `lat`/`lng` below are the ones in use. */
    private String longitude;
    private String latitude;

    private BigDecimal lat;
    private BigDecimal lng;

    @Column(name = "place_id")
    private String placeId;

    private String phone;

    @Column(name = "province_name")
    private String provinceName;

    @Column(name = "district_name")
    private String districtName;

    @Column(name = "ward_name")
    private String wardName;

    @Column(nullable = false)
    private String address;

    private String image;

    @Column(nullable = false)
    private Byte status;

    @Column(name = "is_head", nullable = false)
    private Byte isHead;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
