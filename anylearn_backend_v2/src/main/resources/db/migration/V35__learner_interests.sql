-- What a child likes, what the parent wants them to learn and the monthly budget (all optional, asked when a child is added).
-- source: likes / wants (tag = an interest key from LearnerInterestRules) or budget (tag = one range key). Used for suggestions.
CREATE TABLE `learner_interests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `learner_id` bigint NOT NULL,
  `tag` varchar(40) NOT NULL,
  `source` varchar(10) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_learner_interest` (`learner_id`, `source`, `tag`),
  KEY `idx_learner_interests_tag` (`tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
