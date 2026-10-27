-- Member tiers (plan 10.2): spending of the last 12 months (delivered orders) decides the tier; refreshed every night
-- and whenever an order is paid. Only users with role 'member' get a row.
CREATE TABLE `member_tiers` (
  `user_id` bigint NOT NULL,
  `tier` varchar(20) NOT NULL DEFAULT 'member' COMMENT 'member / silver / gold / diamond',
  `spent_12m` bigint NOT NULL DEFAULT 0,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`user_id`),
  KEY `idx_member_tiers_tier` (`tier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
