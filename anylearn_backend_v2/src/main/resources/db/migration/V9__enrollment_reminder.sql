ALTER TABLE user_course_enrollments
    ADD COLUMN remind_sent_at  DATETIME     NULL,
    ADD COLUMN remind_count    INT UNSIGNED NOT NULL DEFAULT 0;
