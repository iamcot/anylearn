-- A learner's notes on a video lesson, each tied to a second of the lesson (plan 17, learning page).
CREATE TABLE video_lesson_notes (
    id               BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    learner_id       BIGINT       NOT NULL,
    user_id          BIGINT       NOT NULL COMMENT 'account that wrote it',
    lesson_id        BIGINT       NOT NULL,
    item_id          BIGINT       NOT NULL,
    position_seconds INT          NOT NULL DEFAULT 0,
    body             VARCHAR(500) NOT NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_video_note_lesson (learner_id, lesson_id, position_seconds)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
