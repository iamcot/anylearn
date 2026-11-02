-- Zalo ZNS messages sent from approved templates (order paid, payment reminder, course start, mid-course survey).
-- One row per message; the unique dedup_key is claimed before sending, so a message never goes out twice.

CREATE TABLE zns_messages (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT       NULL COMMENT 'account that receives it (NULL for a test send without account)',
    phone         VARCHAR(20)  NOT NULL,
    template_key  VARCHAR(40)  NOT NULL COMMENT 'order_success | order_reminder | course_start | mid_survey',
    template_id   VARCHAR(20)  NOT NULL,
    dedup_key     VARCHAR(120) NOT NULL,
    template_data TEXT         NOT NULL COMMENT 'JSON sent as template_data',
    status        VARCHAR(10)  NOT NULL DEFAULT 'queued' COMMENT 'queued | sent | failed | stub',
    error         VARCHAR(500) NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at       DATETIME     NULL,
    UNIQUE KEY uk_zns_dedup (dedup_key),
    KEY idx_zns_created (created_at),
    KEY idx_zns_template (template_key, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
