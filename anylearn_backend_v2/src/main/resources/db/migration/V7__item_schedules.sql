CREATE TABLE item_schedules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  item_id BIGINT NOT NULL,
  title VARCHAR(255),
  schedule_type VARCHAR(20) NOT NULL DEFAULT 'recurring',
  event_date DATE,
  weekdays VARCHAR(50),
  time_start VARCHAR(8),
  time_end VARCHAR(8),
  date_start DATE,
  date_end DATE,
  duration_value INT,
  duration_unit VARCHAR(10),
  location_note VARCHAR(255),
  status TINYINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_item_id (item_id)
);
