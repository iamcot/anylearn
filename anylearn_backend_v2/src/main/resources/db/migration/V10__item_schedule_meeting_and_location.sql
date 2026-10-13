ALTER TABLE item_schedules
    ADD COLUMN meeting_url      VARCHAR(500) NULL,
    ADD COLUMN meeting_id       VARCHAR(50)  NULL,
    ADD COLUMN meeting_passcode VARCHAR(50)  NULL,
    ADD COLUMN user_location_id BIGINT       NULL,
    ADD COLUMN gather_time      VARCHAR(8)   NULL,
    ADD COLUMN bring_items      VARCHAR(500) NULL;
