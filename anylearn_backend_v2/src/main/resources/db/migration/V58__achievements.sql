-- Shareable achievement banners of Vui học (plan 14, phase 6): one row per achievement, a public token for the share page.
CREATE TABLE achievements (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT       NOT NULL,
    type       VARCHAR(20)  NOT NULL,
    dedup_key  VARCHAR(60)  NOT NULL,
    title      VARCHAR(120) NOT NULL,
    subtitle   VARCHAR(200) NOT NULL DEFAULT '',
    icon       VARCHAR(30)  NOT NULL DEFAULT '',
    token      VARCHAR(16)  NOT NULL,
    opens      INT          NOT NULL DEFAULT 0,
    shares     INT          NOT NULL DEFAULT 0,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_achievement_token (token),
    UNIQUE KEY uq_achievement_user_key (user_id, dedup_key),
    KEY idx_achievement_user (user_id, created_at)
);

ALTER TABLE referral_events ADD COLUMN achievement_id BIGINT NULL, ADD KEY idx_referral_achievement (achievement_id);
