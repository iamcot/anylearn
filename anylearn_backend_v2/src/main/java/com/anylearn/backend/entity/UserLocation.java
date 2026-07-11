package com.anylearn.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
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

    @Column(name = "ward_code", nullable = false, length = 10)
    private String wardCode;

    @Column(name = "district_code", nullable = false, length = 10)
    private String districtCode;

    @Column(name = "province_code", nullable = false, length = 10)
    private String provinceCode;

    @Column(name = "ward_path", nullable = false)
    private String wardPath;

    private String longitude;
    private String latitude;

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
