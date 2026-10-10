-- V6: user_events table for user profile view tracking

CREATE TABLE IF NOT EXISTS `user_events` (
  `id`         bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id`    bigint          NOT NULL COMMENT 'profile owner being viewed',
  `visitor_id` bigint          NULL     COMMENT 'null = anonymous',
  `type`       varchar(20)     NOT NULL COMMENT 'view',
  `created_at` timestamp       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_type`  (`user_id`, `type`),
  INDEX `idx_created`    (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
