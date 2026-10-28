-- Who brought a new account in (plan 14: Vui học, link /ref/{phone}?game=...). One row per new account.
-- users.user_id still carries the referrer for the points chain; this table is for reports and the games.
CREATE TABLE referral_events (
    id          BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    referrer_id BIGINT      NOT NULL,
    new_user_id BIGINT      NOT NULL,
    game_id     VARCHAR(30) NULL,
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_referral_new_user (new_user_id),
    KEY idx_referral_referrer (referrer_id, created_at)
);
