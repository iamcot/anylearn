-- Foundation: a contribution removed in the back office ("Gỡ") keeps its row (so "Nhập đơn cũ" does not add the order
-- again) with removed_at set; its amount was taken back from foundation_state and every list skips it.
ALTER TABLE foundation_contributions ADD COLUMN removed_at DATETIME NULL;
