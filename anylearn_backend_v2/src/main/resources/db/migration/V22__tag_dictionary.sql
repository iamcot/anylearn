-- The old `tags` table held one free-text row per item (and per article), written by the old portal. The back
-- office saved tags in the `items.tags` text column instead, so tags typed there never reached search.
-- New model: one dictionary of tags (curated in the back office) and a link table to items.
RENAME TABLE `tags` TO `tags_old`;

CREATE TABLE `tags` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tag_group` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `sort_order` int NOT NULL DEFAULT '0',
  `status` tinyint NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tags_name_unique` (`name`),
  KEY `tags_group_index` (`tag_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `item_tags` (
  `item_id` bigint NOT NULL,
  `tag_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`item_id`,`tag_id`),
  KEY `item_tags_tag_index` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Existing tags become dictionary entries in group "other" for the team to sort. The unique name uses a
-- case and accent insensitive collation, so "Bóng rổ", "bong ro" and "BÓNG RỔ" become one entry (IGNORE covers the
-- variants that a differently collated old column would keep apart).
INSERT IGNORE INTO `tags` (`name`, `created_at`, `updated_at`)
SELECT TRIM(`tag`) COLLATE utf8mb4_unicode_ci, NOW(), NOW() FROM `tags_old`
WHERE `type` = 'class' AND `status` = 1 AND TRIM(`tag`) <> '' AND CHAR_LENGTH(TRIM(`tag`)) <= 100
GROUP BY TRIM(`tag`) COLLATE utf8mb4_unicode_ci;

-- Tags typed in the back office only exist in the comma separated column. It is split with a small numbers table
-- (no JSON functions: the free text may hold quotes, backslashes or line breaks). Up to 20 tags per course.
CREATE TEMPORARY TABLE `tag_numbers` (`n` int NOT NULL PRIMARY KEY);
INSERT INTO `tag_numbers` (`n`) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20);

CREATE TEMPORARY TABLE `item_csv_tags` (`item_id` bigint NOT NULL, `tag` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL);
INSERT INTO `item_csv_tags` (`item_id`, `tag`)
SELECT i.`id`, TRIM(REPLACE(REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(i.`tags`, ',', nums.`n`), ',', -1), CHAR(10), ' '), CHAR(13), ' '))
FROM `items` i
JOIN `tag_numbers` nums ON nums.`n` <= 1 + CHAR_LENGTH(i.`tags`) - CHAR_LENGTH(REPLACE(i.`tags`, ',', ''))
WHERE i.`tags` IS NOT NULL AND i.`tags` <> '';
DELETE FROM `item_csv_tags` WHERE `tag` = '' OR CHAR_LENGTH(`tag`) > 100;

INSERT IGNORE INTO `tags` (`name`, `created_at`, `updated_at`)
SELECT DISTINCT `tag`, NOW(), NOW() FROM `item_csv_tags`;

INSERT IGNORE INTO `item_tags` (`item_id`, `tag_id`)
SELECT DISTINCT o.`item_id`, t.`id`
FROM `tags_old` o
JOIN `tags` t ON t.`name` = TRIM(o.`tag`) COLLATE utf8mb4_unicode_ci
JOIN `items` i ON i.`id` = o.`item_id`
WHERE o.`type` = 'class' AND o.`status` = 1;

INSERT IGNORE INTO `item_tags` (`item_id`, `tag_id`)
SELECT DISTINCT c.`item_id`, t.`id`
FROM `item_csv_tags` c
JOIN `tags` t ON t.`name` = c.`tag`;

DROP TEMPORARY TABLE `item_csv_tags`;
DROP TEMPORARY TABLE `tag_numbers`;
