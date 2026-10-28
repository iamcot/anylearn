-- Rank quiz leaderboards (plan 14, phase 5): net stars per week / month, settlement of the periods, hide / block flags.
CREATE TABLE quiz_rank_weekly (
    user_id    BIGINT      NOT NULL,
    period     VARCHAR(12) NOT NULL,
    net_stars  INT         NOT NULL DEFAULT 0,
    answers    INT         NOT NULL DEFAULT 0,
    updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, period),
    INDEX idx_quiz_weekly_period (period, net_stars)
);

CREATE TABLE quiz_settlements (
    period     VARCHAR(12) NOT NULL PRIMARY KEY,
    kind       VARCHAR(8)  NOT NULL,
    mode       VARCHAR(8)  NOT NULL,
    settled_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quiz_settlement_winners (
    period    VARCHAR(12)  NOT NULL,
    place     TINYINT      NOT NULL,
    user_id   BIGINT       NOT NULL,
    net_stars INT          NOT NULL,
    reward    VARCHAR(255) NOT NULL DEFAULT '',
    PRIMARY KEY (period, place)
);

ALTER TABLE quiz_profiles
    ADD COLUMN hide_board TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN board_blocked TINYINT(1) NOT NULL DEFAULT 0;
