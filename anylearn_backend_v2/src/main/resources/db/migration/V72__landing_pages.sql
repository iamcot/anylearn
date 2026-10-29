-- Plan 19.A7: landing pages "{môn} cho trẻ {tuổi} tuổi tại {quận}" (TP HCM first), found from real courses and demand.

CREATE TABLE landing_pages (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    path          VARCHAR(200) NOT NULL COMMENT '{tag-slug}/{age}-tuoi/{district-slug}, the address after /hoc/',
    tag_id        BIGINT       NOT NULL,
    age           TINYINT      NOT NULL,
    province_code VARCHAR(10)  NOT NULL,
    district_code VARCHAR(10)  NOT NULL,
    intro         TEXT         NULL COMMENT 'introduction shown when approved',
    intro_status  VARCHAR(10)  NOT NULL DEFAULT 'none' COMMENT 'none | draft | approved',
    enabled       TINYINT(1)   NOT NULL DEFAULT 0,
    course_count  INT          NOT NULL DEFAULT 0 COMMENT 'live courses at the last check',
    demand        INT          NOT NULL DEFAULT 0 COMMENT 'searches of the subject in 90 days at the last check',
    checked_at    DATETIME     NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_landing_path (path),
    UNIQUE KEY uk_landing_combo (tag_id, age, district_code),
    KEY idx_landing_enabled (enabled, course_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
