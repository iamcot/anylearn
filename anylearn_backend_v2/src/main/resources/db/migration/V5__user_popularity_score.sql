-- V5: popularity_score column on users table

ALTER TABLE `users`
  ADD COLUMN `popularity_score` int NOT NULL DEFAULT 0 AFTER `boost_score`;

ALTER TABLE `users`
  ADD INDEX `idx_user_popularity` (`popularity_score`);
