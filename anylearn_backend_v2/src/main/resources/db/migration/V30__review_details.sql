-- More about a review, next to the rating row in item_user_actions (type 'rating'): which order proves the person
-- studied the course, whether the review is shown, the partner's reply, the scores per criterion and the photos.
CREATE TABLE `review_details` (
  `review_id` bigint unsigned NOT NULL,
  `order_id` bigint DEFAULT NULL,
  `is_verified` tinyint NOT NULL DEFAULT 0,
  `status` varchar(16) NOT NULL DEFAULT 'published',
  `partner_reply` text,
  `partner_replied_at` timestamp NULL DEFAULT NULL,
  `partner_replied_by` bigint DEFAULT NULL,
  PRIMARY KEY (`review_id`),
  KEY `review_details_status_index` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `review_scores` (
  `review_id` bigint unsigned NOT NULL,
  `criterion` varchar(24) NOT NULL,
  `score` tinyint NOT NULL,
  PRIMARY KEY (`review_id`,`criterion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `review_media` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `review_id` bigint unsigned NOT NULL,
  `url` varchar(500) NOT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `review_media_review_index` (`review_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews written before this table: verified when the writer has a delivered order for the course.
INSERT IGNORE INTO `review_details` (`review_id`, `order_id`, `is_verified`)
SELECT iua.`id`,
       (SELECT MAX(od.`order_id`) FROM `order_details` od JOIN `orders` o ON o.`id` = od.`order_id`
         WHERE od.`user_id` = iua.`user_id` AND od.`item_id` = iua.`item_id` AND o.`status` = 'delivered'),
       0
FROM `item_user_actions` iua WHERE iua.`type` = 'rating';

UPDATE `review_details` SET `is_verified` = 1 WHERE `order_id` IS NOT NULL;
