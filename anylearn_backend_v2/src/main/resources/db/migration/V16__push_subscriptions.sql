CREATE TABLE push_subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  endpoint VARCHAR(1000) NOT NULL,
  endpoint_hash CHAR(64) NOT NULL,
  p256dh VARCHAR(255) NOT NULL,
  auth VARCHAR(255) NOT NULL,
  platform VARCHAR(20) NULL,
  is_standalone TINYINT(1) NOT NULL DEFAULT 0,
  failure_count INT NOT NULL DEFAULT 0,
  last_success_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_push_endpoint_hash (endpoint_hash),
  INDEX idx_push_user (user_id)
);
