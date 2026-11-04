-- A promotion article can carry one voucher group: the home banner then shows "Lưu mã" next to "Tìm hiểu chương trình".
ALTER TABLE articles ADD COLUMN voucher_group_id BIGINT UNSIGNED NULL;
