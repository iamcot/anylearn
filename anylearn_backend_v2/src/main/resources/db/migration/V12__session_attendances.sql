CREATE TABLE session_attendances (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  child_id BIGINT NOT NULL,
  item_schedule_id BIGINT NOT NULL,
  session_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'attended',
  source VARCHAR(20) NOT NULL,
  joined_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_child_session (child_id, item_schedule_id, session_date),
  INDEX idx_schedule_date (item_schedule_id, session_date)
);
