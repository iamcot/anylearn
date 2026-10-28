-- Khám phá (plan 14, phase 7): posts with photos or clips, likes, comments, reports and a comment ban.
CREATE TABLE explore_posts (
    id             BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    kind           VARCHAR(10)  NOT NULL DEFAULT 'article',
    title          VARCHAR(160) NOT NULL,
    body           TEXT         NULL,
    media_url      VARCHAR(500) NULL,
    poster_url     VARCHAR(500) NULL,
    item_id        BIGINT       NULL,
    status         VARCHAR(10)  NOT NULL DEFAULT 'draft',
    pinned         TINYINT(1)   NOT NULL DEFAULT 0,
    published_at   DATETIME     NULL,
    views          INT          NOT NULL DEFAULT 0,
    likes          INT          NOT NULL DEFAULT 0,
    shares         INT          NOT NULL DEFAULT 0,
    comments_count INT          NOT NULL DEFAULT 0,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_explore_feed (status, pinned, published_at)
);

CREATE TABLE explore_likes (
    post_id    BIGINT   NOT NULL,
    user_id    BIGINT   NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id)
);

CREATE TABLE explore_comments (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    post_id    BIGINT       NOT NULL,
    user_id    BIGINT       NOT NULL,
    body       VARCHAR(500) NOT NULL,
    status     VARCHAR(10)  NOT NULL DEFAULT 'visible',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_explore_comment_post (post_id, status, id),
    KEY idx_explore_comment_user (user_id, created_at)
);

CREATE TABLE explore_comment_reports (
    comment_id BIGINT       NOT NULL,
    user_id    BIGINT       NOT NULL,
    reason     VARCHAR(255) NOT NULL,
    status     VARCHAR(10)  NOT NULL DEFAULT 'open',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (comment_id, user_id),
    KEY idx_explore_report_status (status)
);

CREATE TABLE explore_comment_bans (
    user_id    BIGINT       NOT NULL PRIMARY KEY,
    reason     VARCHAR(255) NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
