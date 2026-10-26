-- anyPoint given for a review (once per review, taken back when the review is hidden) and the reminders sent to
-- parents who have not written a review yet (once per person, course and step).
CREATE TABLE `review_rewards` (
  `review_id` bigint unsigned NOT NULL,
  `user_id` bigint NOT NULL,
  `text_points` int NOT NULL DEFAULT 0,
  `media_points` int NOT NULL DEFAULT 0,
  `revoked_points` int NOT NULL DEFAULT 0,
  `revoked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  KEY `review_rewards_user_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `review_reminders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `item_id` bigint NOT NULL,
  `stage` varchar(8) NOT NULL,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `review_reminders_unique` (`user_id`,`item_id`,`stage`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
