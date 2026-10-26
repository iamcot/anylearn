-- A course (without classes) can be taught at several addresses of its partner. `items.user_location_id` stays as the
-- main one (map point, fallback for the today page); this table holds the full list.
CREATE TABLE `item_locations` (
  `item_id` bigint NOT NULL,
  `user_location_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`item_id`,`user_location_id`),
  KEY `item_locations_location_index` (`user_location_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `item_locations` (`item_id`, `user_location_id`)
SELECT `id`, `user_location_id` FROM `items` WHERE `user_location_id` IS NOT NULL AND `user_location_id` > 0;
