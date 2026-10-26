-- What the team told the family when an activity (trial, entrance test, visit) was approved or declined.
ALTER TABLE `item_activities`
  ADD COLUMN `admin_note` varchar(500) DEFAULT NULL,
  ADD COLUMN `handled_at` timestamp NULL DEFAULT NULL;
