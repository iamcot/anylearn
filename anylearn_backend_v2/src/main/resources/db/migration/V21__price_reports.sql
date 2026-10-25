-- "Thấy giá rẻ hơn ở nơi khác? Báo cho chúng tôi": a visitor tells anyLEARN where a course costs less (plan 10.1).
CREATE TABLE price_reports (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id       BIGINT       NULL,
    user_id       BIGINT       NULL,
    contact_phone VARCHAR(20)  NULL,
    seen_price    BIGINT       NULL,
    seen_place    VARCHAR(255) NULL,
    note          VARCHAR(1000) NULL,
    status        VARCHAR(16)  NOT NULL DEFAULT 'new',
    admin_note    VARCHAR(500) NULL,
    handled_by    BIGINT       NULL,
    created_at    DATETIME     NOT NULL,
    updated_at    DATETIME     NOT NULL,
    INDEX idx_price_reports_status (status, created_at),
    INDEX idx_price_reports_item (item_id)
);
