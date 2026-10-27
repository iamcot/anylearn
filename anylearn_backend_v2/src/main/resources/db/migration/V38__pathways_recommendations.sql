-- Plan 08: pathways (an ordered chain of courses, built by an admin), recommendation events for the click/buy report,
-- and the "Không quan tâm" dismissals that hide a suggestion for a while.
CREATE TABLE `pathways` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(120) NOT NULL,
  `title` varchar(200) NOT NULL,
  `subtitle` varchar(300) DEFAULT NULL,
  `cover` varchar(500) DEFAULT NULL,
  `partner_id` bigint DEFAULT NULL,
  `is_active` tinyint NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pathways_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pathway_steps` (
  `pathway_id` bigint unsigned NOT NULL,
  `item_id` bigint NOT NULL,
  `step_no` int NOT NULL,
  `note` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`pathway_id`,`item_id`),
  KEY `pathway_steps_item_index` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `recommendation_events` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT 'account that saw it',
  `learner_id` bigint NOT NULL,
  `item_id` bigint NOT NULL,
  `source` varchar(30) NOT NULL,
  `context` varchar(30) NOT NULL,
  `event` varchar(10) NOT NULL COMMENT 'view or click',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rec_events_source` (`source`, `event`, `created_at`),
  KEY `idx_rec_events_learner_item` (`learner_id`, `item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `recommendation_dismissals` (
  `learner_id` bigint NOT NULL,
  `item_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `dismissed_until` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`learner_id`, `item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
