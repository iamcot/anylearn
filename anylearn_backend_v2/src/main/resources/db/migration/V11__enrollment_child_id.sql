ALTER TABLE user_course_enrollments
    ADD COLUMN child_id BIGINT NULL,
    ADD INDEX idx_child_id (child_id);

UPDATE user_course_enrollments uce
    JOIN users u ON u.id = uce.user_id AND u.is_child = 1
SET uce.child_id = uce.user_id;
