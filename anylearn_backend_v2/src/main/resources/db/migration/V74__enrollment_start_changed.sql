-- A flexible ("open") class: the parent picks the start date at add-to-cart, and may pick or change it once more
-- from the account page. The time of that change; NULL = the account page may still change it.
ALTER TABLE user_course_enrollments ADD COLUMN start_changed_at DATETIME NULL;
