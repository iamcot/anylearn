-- What a person wants to hear about, per topic and channel (plan 06.4). No row = on; only a choice is stored.
-- topic: schedule / payment / renewal / review / promo (see NotificationTopics); channel: app (bell + push) / email / zalo.
CREATE TABLE `user_notification_prefs` (
  `user_id` bigint NOT NULL,
  `topic` varchar(20) NOT NULL,
  `channel` varchar(10) NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `topic`, `channel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
