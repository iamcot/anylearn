-- Plan 19.A5 / 19.A6: back-office permissions for non-admins, machine keys (t2m), where a Khám phá post came from,
-- and the queue of social posts.

CREATE TABLE admin_permissions (
    user_id    BIGINT      NOT NULL,
    permission VARCHAR(40) NOT NULL COMMENT 'content_review',
    granted_by BIGINT      NULL,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, permission)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE api_keys (
    id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    user_id      BIGINT       NOT NULL COMMENT 'the account the key acts as',
    key_prefix   VARCHAR(12)  NOT NULL COMMENT 'first characters, shown in the list',
    key_hash     CHAR(64)     NOT NULL COMMENT 'sha256 of the key; the key itself is shown once',
    scope        VARCHAR(40)  NOT NULL DEFAULT 'studio',
    created_by   BIGINT       NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME     NULL,
    revoked_at   DATETIME     NULL,
    UNIQUE KEY uk_api_keys_hash (key_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE explore_posts
    ADD COLUMN source VARCHAR(10) NOT NULL DEFAULT 'admin' COMMENT 'admin | creator | t2m' AFTER author_id;

UPDATE explore_posts SET source = 'creator' WHERE author_id IS NOT NULL;

CREATE TABLE social_queue (
    id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    post_id      BIGINT       NULL COMMENT 'Khám phá post, when the social post comes from one',
    channel      VARCHAR(20)  NOT NULL COMMENT 'facebook | zalo | tiktok | youtube | instagram',
    caption      TEXT         NULL,
    link         VARCHAR(500) NULL COMMENT 'the link with UTM the social post points to',
    scheduled_at DATETIME     NULL,
    status       VARCHAR(10)  NOT NULL DEFAULT 'waiting' COMMENT 'waiting | posted | skipped',
    posted_url   VARCHAR(500) NULL,
    posted_at    DATETIME     NULL,
    created_by   BIGINT       NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_social_queue (status, scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
