-- Vui học has its own currency (default name "Ali Xu"), separate from anyPoint, so game rewards never touch wallet_c.
CREATE TABLE fun_wallets (
    user_id    BIGINT   NOT NULL PRIMARY KEY,
    balance    BIGINT   NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fun_coin_ledger (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT       NOT NULL,
    delta         BIGINT       NOT NULL,
    balance_after BIGINT       NOT NULL,
    source        VARCHAR(30)  NOT NULL,
    detail        VARCHAR(255) NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_fun_coin_user (user_id, id),
    KEY idx_fun_coin_created (created_at, source)
);
