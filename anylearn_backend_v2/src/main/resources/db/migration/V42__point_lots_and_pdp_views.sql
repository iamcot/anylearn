-- anyPoint expiry (plan 02.5): a lot is one credit of points to a member; points are spent oldest lot first and a lot
-- expires `points/expiry_months` after max(earned day, `points/expiry_start_date`). wallet_c stays the balance.
CREATE TABLE `point_lots` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `points_earned` bigint NOT NULL,
  `points_remaining` bigint NOT NULL,
  `earned_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_point_lots_user` (`user_id`, `points_remaining`, `earned_at`),
  KEY `idx_point_lots_earned` (`earned_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One reminder per user, day the points go and step (days before).
CREATE TABLE `point_expiry_reminders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `expires_on` date NOT NULL,
  `days_before` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_point_expiry_reminder` (`user_id`, `expires_on`, `days_before`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Opening lot: the balance members already have today.
INSERT INTO `point_lots` (`user_id`, `points_earned`, `points_remaining`, `earned_at`)
SELECT `id`, `wallet_c`, `wallet_c`, NOW() FROM `users` WHERE `role` = 'member' AND `wallet_c` > 0;

-- Course page opens per person (plan: AI suggestion signals): one row per person, course and day.
CREATE TABLE `item_view_days` (
  `user_id` bigint NOT NULL,
  `item_id` bigint NOT NULL,
  `day` date NOT NULL,
  `views` int NOT NULL DEFAULT 1,
  `last_viewed_at` datetime NOT NULL,
  PRIMARY KEY (`user_id`, `item_id`, `day`),
  KEY `idx_item_view_days_day` (`day`),
  KEY `idx_item_view_days_user_last` (`user_id`, `last_viewed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
