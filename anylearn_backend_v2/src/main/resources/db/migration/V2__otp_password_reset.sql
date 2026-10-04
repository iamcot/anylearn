CREATE TABLE otp_verifications (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    phone      VARCHAR(20) NOT NULL,
    otp_code   VARCHAR(6)  NOT NULL,
    purpose    VARCHAR(20) NOT NULL,
    verified   BOOLEAN     NOT NULL DEFAULT FALSE,
    attempts   INT         NOT NULL DEFAULT 0,
    expires_at DATETIME    NOT NULL,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_otp_phone_purpose (phone, purpose)
);

CREATE TABLE password_reset_tokens (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    phone      VARCHAR(20) NOT NULL,
    token      VARCHAR(64) NOT NULL UNIQUE,
    used       BOOLEAN     NOT NULL DEFAULT FALSE,
    expires_at DATETIME    NOT NULL,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
