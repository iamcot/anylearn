ALTER TABLE user_course_enrollments
    DROP INDEX idx_child_id,
    DROP COLUMN child_id;

ALTER TABLE session_attendances
    RENAME COLUMN child_id TO learner_id,
    RENAME INDEX uq_child_session TO uq_learner_session;

ALTER TABLE schedule_requests
    RENAME COLUMN child_id TO learner_id,
    RENAME COLUMN parent_id TO account_id,
    RENAME INDEX idx_child_id TO idx_learner_id,
    RENAME INDEX idx_parent_id TO idx_account_id;
