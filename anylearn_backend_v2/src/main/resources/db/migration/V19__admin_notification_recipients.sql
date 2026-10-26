-- Members besides role "admin" who also receive what the back office is told (new orders, bank transfers, course requests...).
CREATE TABLE admin_notification_recipients (
  user_id BIGINT NOT NULL PRIMARY KEY,
  added_by BIGINT NULL,
  created_at DATETIME NOT NULL
);
