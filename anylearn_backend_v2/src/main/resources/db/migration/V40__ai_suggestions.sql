-- AI course suggestions: one answer per learner per day (the cache that keeps it to one AI call a day), the parent's
-- thumbs up/down on it, and the learner's own survey answers (a learner_interests row with source 'done' means "answered or skipped").
CREATE TABLE `ai_suggestions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT 'account that asked',
  `learner_id` bigint NOT NULL,
  `day` date NOT NULL,
  `model` varchar(60) NOT NULL,
  `candidates` int NOT NULL DEFAULT 0 COMMENT 'courses sent to the AI',
  `input_tokens` int NOT NULL DEFAULT 0,
  `output_tokens` int NOT NULL DEFAULT 0,
  `items_json` mediumtext NOT NULL COMMENT '[{"itemId":1,"reason":"..."}] in display order',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ai_suggestions_learner_day` (`learner_id`, `day`),
  KEY `idx_ai_suggestions_day` (`day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ai_suggestion_feedback` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `suggestion_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `learner_id` bigint NOT NULL,
  `rating` tinyint NOT NULL COMMENT '1 = thumbs up, -1 = thumbs down',
  `reasons` varchar(200) DEFAULT NULL COMMENT 'comma separated quick feedback keys',
  `comment` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ai_feedback_suggestion` (`suggestion_id`),
  KEY `idx_ai_feedback_learner` (`learner_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
