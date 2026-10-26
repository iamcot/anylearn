-- Partner branches: coordinates as real numbers, the Google place they came from, and the administrative
-- codes become optional so a branch can be saved before its district is matched.
ALTER TABLE `user_locations`
  MODIFY `ward_code` varchar(10) COLLATE utf8mb4_unicode_ci NULL,
  MODIFY `district_code` varchar(10) COLLATE utf8mb4_unicode_ci NULL,
  MODIFY `province_code` varchar(10) COLLATE utf8mb4_unicode_ci NULL,
  MODIFY `ward_path` varchar(255) COLLATE utf8mb4_unicode_ci NULL,
  ADD COLUMN `lat` decimal(10,7) NULL,
  ADD COLUMN `lng` decimal(10,7) NULL,
  ADD COLUMN `place_id` varchar(255) COLLATE utf8mb4_unicode_ci NULL,
  ADD COLUMN `phone` varchar(20) COLLATE utf8mb4_unicode_ci NULL,
  ADD COLUMN `province_name` varchar(100) COLLATE utf8mb4_unicode_ci NULL,
  ADD COLUMN `district_name` varchar(100) COLLATE utf8mb4_unicode_ci NULL,
  ADD COLUMN `ward_name` varchar(100) COLLATE utf8mb4_unicode_ci NULL,
  ADD KEY `user_locations_user_place_index` (`user_id`, `place_id`);

-- The old text columns hold anything (empty, words, "10,77"); CASE keeps the CAST from running on a bad value.
UPDATE `user_locations`
SET `lat` = CASE WHEN `latitude` REGEXP '^-?[0-9]{1,3}([.][0-9]+)?$' AND `longitude` REGEXP '^-?[0-9]{1,3}([.][0-9]+)?$'
                  THEN CASE WHEN CAST(`latitude` AS DECIMAL(12,7)) BETWEEN -90 AND 90 AND CAST(`longitude` AS DECIMAL(12,7)) BETWEEN -180 AND 180
                            THEN CAST(`latitude` AS DECIMAL(10,7)) END END,
    `lng` = CASE WHEN `latitude` REGEXP '^-?[0-9]{1,3}([.][0-9]+)?$' AND `longitude` REGEXP '^-?[0-9]{1,3}([.][0-9]+)?$'
                  THEN CASE WHEN CAST(`latitude` AS DECIMAL(12,7)) BETWEEN -90 AND 90 AND CAST(`longitude` AS DECIMAL(12,7)) BETWEEN -180 AND 180
                            THEN CAST(`longitude` AS DECIMAL(10,7)) END END;

UPDATE `user_locations` ul JOIN `provinces` p ON p.`code` = ul.`province_code` SET ul.`province_name` = p.`name`;
UPDATE `user_locations` ul JOIN `districts` d ON d.`code` = ul.`district_code` SET ul.`district_name` = d.`name`;
UPDATE `user_locations` ul JOIN `wards` w ON w.`code` = ul.`ward_code` SET ul.`ward_name` = w.`name`;
