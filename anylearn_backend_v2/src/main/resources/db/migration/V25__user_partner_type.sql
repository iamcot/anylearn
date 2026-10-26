-- What kind of partner teaches: school, center, club, tutor, expert. Set in the back office; courses inherit it.
ALTER TABLE `users` ADD COLUMN `partner_type` varchar(20) COLLATE utf8mb4_unicode_ci NULL;
