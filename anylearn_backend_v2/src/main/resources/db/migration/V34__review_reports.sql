-- A partner asks the team to look at a review (unfair, off topic, wrong course). The partner cannot delete it:
-- the team keeps it ('kept') or hides it ('hidden'). One report per review and partner.
CREATE TABLE `review_reports` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `review_id` bigint NOT NULL,
  `item_id` bigint NOT NULL,
  `reporter_id` bigint NOT NULL,
  `reason` varchar(500) NOT NULL,
  `status` varchar(10) NOT NULL DEFAULT 'new',
  `handled_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_review_reports_review_reporter` (`review_id`, `reporter_id`),
  KEY `idx_review_reports_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
