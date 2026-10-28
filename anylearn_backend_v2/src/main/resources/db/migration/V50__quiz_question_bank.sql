-- Vui học (plan 14, phase 2): the AI question bank of the rank quiz.
CREATE TABLE quiz_questions (
    id            BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    topic         VARCHAR(20)   NOT NULL,
    difficulty    TINYINT       NOT NULL,
    body          VARCHAR(400)  NOT NULL,
    opt_a         VARCHAR(160)  NOT NULL,
    opt_b         VARCHAR(160)  NOT NULL,
    opt_c         VARCHAR(160)  NOT NULL,
    opt_d         VARCHAR(160)  NOT NULL,
    correct       TINYINT       NOT NULL,
    explanation   VARCHAR(400)  NULL,
    hash          CHAR(64)      NOT NULL,
    status        VARCHAR(10)   NOT NULL DEFAULT 'pending',
    verified      TINYINT       NOT NULL DEFAULT 0,
    review_note   VARCHAR(200)  NULL,
    searchable    TINYINT       NOT NULL DEFAULT 0,
    report_count  INT           NOT NULL DEFAULT 0,
    times_served  INT           NOT NULL DEFAULT 0,
    times_correct INT           NOT NULL DEFAULT 0,
    source        VARCHAR(10)   NOT NULL DEFAULT 'ai',
    model         VARCHAR(60)   NULL,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_quiz_questions_hash (hash),
    KEY idx_quiz_questions_cell (status, topic, difficulty)
);

CREATE TABLE quiz_question_reports (
    question_id BIGINT      NOT NULL,
    user_id     BIGINT      NOT NULL,
    reason      VARCHAR(30) NOT NULL,
    note        VARCHAR(200) NULL,
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (question_id, user_id)
);

CREATE TABLE quiz_gen_runs (
    id          BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    topic       VARCHAR(20) NOT NULL,
    difficulty  TINYINT     NOT NULL,
    requested   INT         NOT NULL,
    returned    INT         NOT NULL DEFAULT 0,
    invalid     INT         NOT NULL DEFAULT 0,
    duplicates  INT         NOT NULL DEFAULT 0,
    saved       INT         NOT NULL DEFAULT 0,
    verify_failed INT       NOT NULL DEFAULT 0,
    input_tokens  INT       NOT NULL DEFAULT 0,
    output_tokens INT       NOT NULL DEFAULT 0,
    error       VARCHAR(200) NULL,
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_quiz_gen_runs_created (created_at)
);
