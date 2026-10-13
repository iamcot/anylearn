CREATE TABLE schedule_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  child_id BIGINT NOT NULL,
  parent_id BIGINT NOT NULL,
  enrollment_id BIGINT NOT NULL,
  item_schedule_id BIGINT NOT NULL,
  session_date DATE NOT NULL,
  type VARCHAR(20) NOT NULL,
  note VARCHAR(500) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_note VARCHAR(500) NULL,
  handled_by BIGINT NULL,
  handled_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_child_id (child_id),
  INDEX idx_parent_id (parent_id)
);
