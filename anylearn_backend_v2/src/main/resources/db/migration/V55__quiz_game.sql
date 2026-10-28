-- Vui học (plan 14, phase 4): the rank quiz game. Rewards and prices are in the game currency (Leo Xu), never anyPoint.
CREATE TABLE quiz_profiles (
    user_id           BIGINT   NOT NULL PRIMARY KEY,
    rank_idx          TINYINT  NOT NULL DEFAULT 0,
    stars             INT      NOT NULL DEFAULT 0,
    guard             TINYINT  NOT NULL DEFAULT 1,
    streak            INT      NOT NULL DEFAULT 0,
    best_rank_idx     TINYINT  NOT NULL DEFAULT 0,
    games             INT      NOT NULL DEFAULT 0,
    correct           INT      NOT NULL DEFAULT 0,
    wrong             INT      NOT NULL DEFAULT 0,
    active_attempt_id BIGINT   NULL,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- one row per question handed out; the right answer is never sent to the browser
CREATE TABLE quiz_attempts (
    id           BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT      NOT NULL,
    question_id  BIGINT      NOT NULL,
    rank_idx     TINYINT     NOT NULL,
    stars_before INT         NOT NULL,
    stars_after  INT         NULL,
    option_order VARCHAR(20) NOT NULL,
    hidden       VARCHAR(20) NULL,
    community    VARCHAR(40) NULL,
    items_used   VARCHAR(120) NULL,
    answer       TINYINT     NULL,
    outcome      VARCHAR(10) NOT NULL DEFAULT 'open',
    flagged      TINYINT     NOT NULL DEFAULT 0,
    issued_at    DATETIME(3) NOT NULL,
    expires_at   DATETIME(3) NOT NULL,
    answered_at  DATETIME(3) NULL,
    KEY idx_quiz_attempts_user_question (user_id, question_id),
    KEY idx_quiz_attempts_user_time (user_id, issued_at),
    KEY idx_quiz_attempts_question (question_id, outcome)
);

CREATE TABLE quiz_user_items (
    user_id  BIGINT      NOT NULL,
    item_key VARCHAR(12) NOT NULL,
    qty      INT         NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, item_key)
);

CREATE TABLE quiz_item_log (
    id         BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT      NOT NULL,
    item_key   VARCHAR(12) NOT NULL,
    delta      INT         NOT NULL,
    source     VARCHAR(12) NOT NULL,
    ref        VARCHAR(60) NULL,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_quiz_item_log_user (user_id, id),
    KEY idx_quiz_item_log_buy (user_id, source, created_at)
);

CREATE TABLE quiz_drop_state (
    user_id     BIGINT NOT NULL PRIMARY KEY,
    pity        INT    NOT NULL DEFAULT 0,
    drops_today INT    NOT NULL DEFAULT 0,
    drops_day   DATE   NULL,
    starter_day DATE   NULL
);
