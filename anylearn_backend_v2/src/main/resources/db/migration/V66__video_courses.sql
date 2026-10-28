-- Plan 17: video courses. The three tables of the old portal are kept (chapters, lessons, progress) and fitted to Bunny
-- Stream; the study plan is new. Reminders and suggestions reuse lifecycle_messages for their once-only keys.

ALTER TABLE item_video_chapters
    MODIFY COLUMN description TEXT NULL,
    ADD KEY idx_video_chapters_order (item_id, chapter_no);

-- type: video (Bunny, video_id) | link (YouTube or another link in type_value) | text (a reading, type_value is the text).
-- video_status: uploading / processing / ready / failed (Bunny's state, refreshed from its API). `length` is no longer read.
ALTER TABLE item_video_lessons
    MODIFY COLUMN description TEXT NULL,
    MODIFY COLUMN type VARCHAR(20) NOT NULL DEFAULT 'video',
    ADD COLUMN video_id         VARCHAR(64)  NULL,
    ADD COLUMN video_status     VARCHAR(20)  NULL,
    ADD COLUMN duration_seconds INT          NULL,
    ADD COLUMN poster_url       VARCHAR(500) NULL,
    ADD COLUMN attachments      TEXT         NULL COMMENT 'JSON [{name, url}]',
    ADD KEY idx_video_lessons_order (item_id, item_video_chapter_id, lesson_no);

-- One row per learner (the account or a child) and lesson. user_id = the account that pressed play (the parent for a
-- child). position_seconds = where to start next time; watched_seconds = real time watched (seeking does not add to it).
ALTER TABLE item_video_lesson_user_links
    ADD COLUMN learner_id       BIGINT   NULL AFTER user_id,
    ADD COLUMN item_id          BIGINT   NULL AFTER learner_id,
    ADD COLUMN position_seconds INT      NOT NULL DEFAULT 0,
    ADD COLUMN watched_seconds  INT      NOT NULL DEFAULT 0,
    ADD COLUMN completed_at     DATETIME NULL;

UPDATE item_video_lesson_user_links l
    JOIN item_video_lessons v ON v.id = l.item_video_lesson_id
SET l.learner_id = l.user_id, l.item_id = v.item_id,
    l.completed_at = IF(l.complete = 1, COALESCE(l.updated_at, l.created_at, NOW()), NULL)
WHERE l.learner_id IS NULL;

DELETE l1 FROM item_video_lesson_user_links l1
    JOIN item_video_lesson_user_links l2
      ON l2.learner_id = l1.learner_id AND l2.item_video_lesson_id = l1.item_video_lesson_id AND l2.id > l1.id;

ALTER TABLE item_video_lesson_user_links
    ADD UNIQUE KEY uq_video_progress (learner_id, item_video_lesson_id),
    ADD KEY idx_video_progress_course (learner_id, item_id, updated_at);

-- Self-study plan of a learner for one course: weekdays (1 = Monday .. 7 = Sunday, comma separated) and a time.
CREATE TABLE video_study_plans (
    id                  BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    learner_id          BIGINT      NOT NULL,
    user_id             BIGINT      NOT NULL COMMENT 'account that gets the reminder',
    item_id             BIGINT      NOT NULL,
    weekdays            VARCHAR(20) NOT NULL,
    study_time          TIME        NOT NULL,
    lessons_per_session INT         NOT NULL DEFAULT 1,
    enabled             TINYINT(1)  NOT NULL DEFAULT 1,
    created_at          DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_video_study_plan (learner_id, item_id),
    KEY idx_video_study_user (user_id)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
