-- Vui học (plan 14): the daily check-in gift and one log of everything that happens in the games.
CREATE TABLE fun_checkins (
    user_id    BIGINT   NOT NULL,
    day        DATE     NOT NULL,
    streak     INT      NOT NULL,
    points     INT      NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, day),
    KEY idx_fun_checkins_day (day)
);

CREATE TABLE game_events (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT       NULL,
    game       VARCHAR(30)  NOT NULL,
    type       VARCHAR(40)  NOT NULL,
    detail     VARCHAR(500) NULL,
    points     INT          NOT NULL DEFAULT 0,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_game_events_created (created_at),
    KEY idx_game_events_game (game, created_at),
    KEY idx_game_events_user (user_id, created_at)
);
