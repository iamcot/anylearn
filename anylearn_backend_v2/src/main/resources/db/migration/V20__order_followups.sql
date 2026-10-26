-- What the system already did about an order that waits for payment: reminders sent and the expiry.
-- UNIQUE (order_id, kind, stage) is what stops the same reminder from going out twice.
CREATE TABLE order_followups (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id   BIGINT       NOT NULL,
    kind       VARCHAR(16)  NOT NULL,   -- 'remind' or 'expire'
    stage      INT          NOT NULL DEFAULT 0,   -- 1-based reminder step; 0 for expire
    created_at DATETIME     NOT NULL,
    UNIQUE KEY uq_order_followup (order_id, kind, stage),
    INDEX idx_order_followup_kind (kind, created_at)
);
