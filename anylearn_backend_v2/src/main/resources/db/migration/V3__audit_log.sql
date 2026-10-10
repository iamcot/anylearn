CREATE TABLE audit_runs (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    ran_at           DATETIME    NOT NULL,
    triggered_by     VARCHAR(20) NOT NULL COMMENT 'scheduled | manual',
    discrepancy_count INT        NOT NULL DEFAULT 0,
    status           VARCHAR(10) NOT NULL COMMENT 'ok | warning',
    created_at       DATETIME    NOT NULL
);

CREATE TABLE audit_run_details (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    run_id   BIGINT NOT NULL,
    user_id  BIGINT NOT NULL,
    wallet_c BIGINT NOT NULL,
    tx_sum   BIGINT NOT NULL,
    delta    BIGINT NOT NULL,
    CONSTRAINT fk_ard_run FOREIGN KEY (run_id) REFERENCES audit_runs (id) ON DELETE CASCADE
);
