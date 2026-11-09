-- Orders an admin entered by hand (back office "Đơn hàng" > "Nhập đơn tay"): who entered it, whether the buyer's account
-- was created for it, and the admin's note. The order itself is a normal row of `orders`.
-- (V83 / V84 are taken by the farm game branch.)

CREATE TABLE manual_orders (
    id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id        BIGINT       NOT NULL,
    admin_id        BIGINT       NOT NULL,
    buyer_id        BIGINT       NOT NULL,
    account_created TINYINT(1)   NOT NULL DEFAULT 0,
    note            VARCHAR(500) NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_manual_order (order_id),
    KEY idx_manual_admin (admin_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
