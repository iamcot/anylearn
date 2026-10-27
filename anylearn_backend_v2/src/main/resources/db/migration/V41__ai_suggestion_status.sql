-- 'ai' = the AI's picks, 'fallback' = the AI was asked but its answer could not be used, so the rule ranking was saved
-- (the day's single AI call is spent either way, and the learner sees the same list when opening it again).
ALTER TABLE `ai_suggestions` ADD COLUMN `status` varchar(10) NOT NULL DEFAULT 'ai' AFTER `model`;
