-- One row per call to the Anthropic API, written by AnthropicClient for every feature (suggestions, comparison, quiz bank).
CREATE TABLE ai_usage_log (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    feature       VARCHAR(30)  NOT NULL,
    model         VARCHAR(60)  NOT NULL,
    input_tokens  INT          NOT NULL DEFAULT 0,
    output_tokens INT          NOT NULL DEFAULT 0,
    duration_ms   INT          NOT NULL DEFAULT 0,
    ok            TINYINT      NOT NULL DEFAULT 1,
    error         VARCHAR(200) NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ai_usage_created (created_at),
    INDEX idx_ai_usage_feature (feature, created_at)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
