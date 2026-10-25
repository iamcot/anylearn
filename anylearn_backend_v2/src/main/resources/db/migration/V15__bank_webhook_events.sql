CREATE TABLE bank_webhook_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(20) NOT NULL,
  provider_txn_id VARCHAR(64) NOT NULL,
  direction VARCHAR(8) NOT NULL,
  amount BIGINT NOT NULL,
  content TEXT NULL,
  account_no VARCHAR(40) NULL,
  transferred_at DATETIME NOT NULL,
  raw TEXT NULL,
  match_status VARCHAR(20) NOT NULL,
  order_id BIGINT NULL,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_provider_txn (provider, provider_txn_id),
  INDEX idx_order_id (order_id),
  INDEX idx_match_status (match_status)
);
