-- Plan 20: voucher wallet, vouchers limited to some courses, a voucher really lowers the order.

-- A voucher group may be limited to some courses (no row = every course).
CREATE TABLE IF NOT EXISTS voucher_group_items (
  voucher_group_id BIGINT NOT NULL,
  item_id          BIGINT NOT NULL,
  PRIMARY KEY (voucher_group_id, item_id),
  KEY idx_vgi_item (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Display name, "people can collect it themselves", how long a copy stays in a wallet, partner and places.
ALTER TABLE voucher_groups
  ADD COLUMN title       VARCHAR(191) NULL,
  ADD COLUMN collectible TINYINT NOT NULL DEFAULT 0,
  ADD COLUMN wallet_days INT NULL,
  ADD COLUMN partner_id  BIGINT NULL,           -- a partner's voucher: only that partner's courses
  ADD COLUMN show_on     VARCHAR(100) NULL;     -- where people can collect it: home,search,pdp,partner,fun,tier

CREATE INDEX idx_voucher_groups_partner ON voucher_groups (partner_id);


-- How much a use took off the order (shown on the order, given back on cancel).
ALTER TABLE vouchers_used
  ADD COLUMN discount BIGINT NOT NULL DEFAULT 0;

-- The voucher wallet: one row per voucher a person holds.
CREATE TABLE IF NOT EXISTS user_vouchers (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id          BIGINT NOT NULL,
  voucher_id       BIGINT NOT NULL,
  voucher_group_id BIGINT NOT NULL,
  source           VARCHAR(20) NOT NULL,           -- event / collect / shop / admin / code
  voucher_event_id BIGINT NULL,
  status           VARCHAR(10) NOT NULL DEFAULT 'active', -- active / used
  expires_at       DATETIME NULL,
  used_order_id    BIGINT NULL,
  used_at          DATETIME NULL,
  created_at       DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_vouchers_user_voucher (user_id, voucher_id),
  KEY idx_user_vouchers_user (user_id, status),
  KEY idx_user_vouchers_group (voucher_group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
