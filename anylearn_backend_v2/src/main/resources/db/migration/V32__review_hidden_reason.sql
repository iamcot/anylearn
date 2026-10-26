-- Why an admin hid a review (shown to the author so they can fix it) and when the author changed it afterwards.
ALTER TABLE `review_details`
  ADD COLUMN `hidden_reason` varchar(500) DEFAULT NULL,
  ADD COLUMN `hidden_at` timestamp NULL DEFAULT NULL,
  ADD COLUMN `resubmitted_at` timestamp NULL DEFAULT NULL;
