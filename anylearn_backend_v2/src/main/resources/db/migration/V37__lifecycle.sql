-- Plan 07: every lifecycle message that was planned or sent (dedup_key is unique, so nothing goes out twice),
-- and the one-question survey answers in the middle of a course.
CREATE TABLE `lifecycle_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `enrollment_id` bigint NULL,
  `learner_id` bigint NOT NULL,
  `user_id` bigint NOT NULL COMMENT 'account that receives it (the parent for a child)',
  `stage` varchar(30) NOT NULL,
  `dedup_key` varchar(160) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_lifecycle_dedup` (`dedup_key`),
  KEY `idx_lifecycle_enrollment` (`enrollment_id`, `stage`),
  KEY `idx_lifecycle_user` (`user_id`, `stage`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `enrollment_feedback` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `enrollment_id` bigint NOT NULL,
  `learner_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `stage` varchar(30) NOT NULL DEFAULT 'mid',
  `score` tinyint NOT NULL,
  `note` text NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_feedback` (`enrollment_id`, `stage`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
