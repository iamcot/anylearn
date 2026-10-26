-- A member follows a partner (school, expert) to hear when a new course opens.
CREATE TABLE `follows` (
  `user_id` bigint NOT NULL,
  `partner_id` bigint NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`partner_id`),
  KEY `follows_partner_index` (`partner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A course is announced to the followers of its partner once, even if it is switched off and on again.
CREATE TABLE `follow_announcements` (
  `item_id` bigint NOT NULL,
  `announced_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
