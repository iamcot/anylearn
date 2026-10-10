-- V4: item_events table for behavioral tracking + popularity_score on items

CREATE TABLE IF NOT EXISTS `item_events` (
  `id`         bigint unsigned NOT NULL AUTO_INCREMENT,
  `item_id`    bigint          NOT NULL,
  `user_id`    bigint          NULL,
  `type`       varchar(20)     NOT NULL COMMENT 'view | cart',
  `created_at` timestamp       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_item_type` (`item_id`, `type`),
  INDEX `idx_created`   (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `items`
  ADD COLUMN `popularity_score` int NOT NULL DEFAULT 0 AFTER `boost_score`;

ALTER TABLE `items`
  ADD INDEX `idx_popularity` (`popularity_score`);
