-- A pathway step can hold several courses (alternatives): they share `step_no`; `item_order` is the admin's order inside the step.
ALTER TABLE `pathway_steps` ADD COLUMN `item_order` int NOT NULL DEFAULT 0 AFTER `step_no`;

-- "Đặt lại": a learner who skipped a step asks to go back to it; the suggestions then point at that step again.
CREATE TABLE `pathway_restarts` (
  `learner_id` bigint NOT NULL,
  `pathway_id` bigint unsigned NOT NULL,
  `step_no` int NOT NULL,
  `user_id` bigint NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`learner_id`,`pathway_id`,`step_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
