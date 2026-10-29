-- Plan 19.A4: where an account came from (first touch, one row per account) and visits per day by source.

CREATE TABLE user_acquisition (
    user_id         BIGINT       NOT NULL PRIMARY KEY,
    utm_source      VARCHAR(100) NULL,
    utm_medium      VARCHAR(100) NULL,
    utm_campaign    VARCHAR(100) NULL,
    utm_content     VARCHAR(100) NULL COMMENT 'video / post code',
    utm_term        VARCHAR(100) NULL,
    explore_post_id BIGINT       NULL COMMENT 'Khám phá post of the landing link or utm_content',
    ref             VARCHAR(30)  NULL COMMENT 'referral code used at registration',
    landing_path    VARCHAR(300) NULL,
    first_seen_at   DATETIME     NULL COMMENT 'when the browser first came with these parameters',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_acq_source (utm_source, utm_campaign),
    KEY idx_acq_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE landing_visits (
    day          DATE         NOT NULL,
    utm_source   VARCHAR(100) NOT NULL DEFAULT '',
    utm_medium   VARCHAR(100) NOT NULL DEFAULT '',
    utm_campaign VARCHAR(100) NOT NULL DEFAULT '',
    utm_content  VARCHAR(100) NOT NULL DEFAULT '',
    visits       INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (day, utm_source, utm_medium, utm_campaign, utm_content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
