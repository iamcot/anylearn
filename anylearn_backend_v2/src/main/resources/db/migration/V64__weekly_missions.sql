-- Plan 15, part C: weekly missions of Vui học. Progress is read from game_events; only the claims are stored.
-- mission_key is a mission key or 'bonus' (the free sticker of a week with enough missions done).
CREATE TABLE fun_mission_claims (
    user_id     BIGINT      NOT NULL,
    week_key    VARCHAR(10) NOT NULL,
    mission_key VARCHAR(40) NOT NULL,
    claimed_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    coins       INT         NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, week_key, mission_key),
    KEY idx_fun_mission_claims_week (week_key, mission_key)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
