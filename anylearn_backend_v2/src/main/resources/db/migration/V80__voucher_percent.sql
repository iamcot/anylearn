-- Percent vouchers (plan 20 follow-up): voucher_groups.type = 'percent' takes `value` % off the covered lines,
-- never more than max_discount VND (NULL or 0 = no cap). Money groups ignore the column.
ALTER TABLE voucher_groups ADD COLUMN max_discount BIGINT NULL;
