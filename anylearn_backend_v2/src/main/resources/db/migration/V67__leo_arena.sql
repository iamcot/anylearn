-- Vui hoc (plan 18): Dau truong Leo, a live quiz that opens by itself every day.
CREATE TABLE arena_sessions (
    id                BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    day               DATE        NOT NULL,
    starts_at         DATETIME    NOT NULL,
    open_at           DATETIME    NOT NULL,
    question_count    INT         NOT NULL,
    countdown_seconds INT         NOT NULL,
    answer_seconds    INT         NOT NULL,
    reveal_seconds    INT         NOT NULL,
    gap_seconds       INT         NOT NULL,
    status            VARCHAR(16) NOT NULL DEFAULT 'scheduled',
    reminders_sent_at DATETIME    NULL,
    settled_at        DATETIME    NULL,
    players           INT         NOT NULL DEFAULT 0,
    created_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_arena_session_day (day)
);

CREATE TABLE arena_questions (
    session_id  BIGINT      NOT NULL,
    q_no        INT         NOT NULL,
    question_id BIGINT      NOT NULL,
    topic       VARCHAR(40) NOT NULL,
    difficulty  INT         NOT NULL,
    PRIMARY KEY (session_id, q_no),
    KEY idx_arena_q_question (question_id)
);

CREATE TABLE arena_entries (
    session_id    BIGINT       NOT NULL,
    user_id       BIGINT       NOT NULL,
    registered_at DATETIME     NULL,
    entered_at    DATETIME     NULL,
    last_seen_at  DATETIME     NULL,
    score         INT          NOT NULL DEFAULT 0,
    correct_ms    BIGINT       NOT NULL DEFAULT 0,
    answered      INT          NOT NULL DEFAULT 0,
    flagged       TINYINT      NOT NULL DEFAULT 0,
    flag_reason   VARCHAR(191) NULL,
    disqualified  TINYINT      NOT NULL DEFAULT 0,
    final_rank    INT          NULL,
    reward_coins  INT          NOT NULL DEFAULT 0,
    rewarded_at   DATETIME     NULL,
    reminded_at   DATETIME     NULL,
    PRIMARY KEY (session_id, user_id),
    KEY idx_arena_entry_rank (session_id, score, correct_ms)
);

CREATE TABLE arena_answers (
    session_id  BIGINT   NOT NULL,
    q_no        INT      NOT NULL,
    user_id     BIGINT   NOT NULL,
    option_idx  INT      NULL,
    correct     TINYINT  NOT NULL,
    ms          INT      NOT NULL,
    away        TINYINT  NOT NULL DEFAULT 0,
    flagged     TINYINT  NOT NULL DEFAULT 0,
    answered_at DATETIME NOT NULL,
    PRIMARY KEY (session_id, q_no, user_id)
);
