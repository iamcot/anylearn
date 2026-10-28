-- Plan 16: creators post to Khám phá from /fun, posts carry tags of the shared dictionary, and each person's views are kept
-- so the feed puts unseen posts first.

-- level: creator (every new or edited post waits for an admin) or s_creator (publishes without review).
CREATE TABLE explore_creators (
    user_id    BIGINT       NOT NULL PRIMARY KEY,
    level      VARCHAR(10)  NOT NULL DEFAULT 'creator',
    note       VARCHAR(255) NULL,
    added_by   BIGINT       NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- author_id NULL = a post of anyLEARN (written in the back office).
-- approved = the current content was accepted (a creator's edit sets it to 0); hidden_by = creator | admin;
-- review_note = why an admin rejected or hid it; after_upload = the status the post takes once its clip has uploaded.
ALTER TABLE explore_posts
    ADD COLUMN author_id    BIGINT       NULL AFTER id,
    ADD COLUMN approved     TINYINT(1)   NOT NULL DEFAULT 1,
    ADD COLUMN hidden_by    VARCHAR(10)  NULL,
    ADD COLUMN review_note  VARCHAR(255) NULL,
    ADD COLUMN after_upload VARCHAR(10)  NULL,
    ADD KEY idx_explore_author (author_id, id);

CREATE TABLE explore_post_tags (
    post_id BIGINT NOT NULL,
    tag_id  BIGINT NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    KEY idx_explore_post_tags_tag (tag_id)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE explore_seen (
    user_id  BIGINT   NOT NULL,
    post_id  BIGINT   NOT NULL,
    first_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    times    INT      NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, post_id),
    KEY idx_explore_seen_user (user_id, last_at)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
