-- Vouchers bought with Leo Xu (game coins) in the Leo Xu shop.
-- coin_exchange = 1: people can buy one copy of the group for coin_price Leo Xu (only dynamic groups, each copy is a new code).
-- coin_rebuy_days: after using a bought copy, the person can buy the group again this many days later (default 30).
ALTER TABLE voucher_groups
  ADD COLUMN coin_exchange   TINYINT NOT NULL DEFAULT 0,
  ADD COLUMN coin_price      INT NULL,
  ADD COLUMN coin_rebuy_days INT NOT NULL DEFAULT 30;
