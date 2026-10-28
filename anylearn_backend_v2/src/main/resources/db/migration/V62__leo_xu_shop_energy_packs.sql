-- Plan 15, part A: Leo Xu shop, energy and training packs for the rank quiz.
-- Energy: NULL means a full bar (the value is worked out lazily from `energy` + `energy_at`, see QuizEnergy).
ALTER TABLE quiz_profiles
    ADD COLUMN energy         INT      NULL,
    ADD COLUMN energy_at      DATETIME NULL,
    ADD COLUMN active_pack_id BIGINT   NULL;

-- 'rank' = the normal game, 'practice' = a question of a training pack (no stars, drops, board or energy)
ALTER TABLE quiz_attempts
    ADD COLUMN mode    VARCHAR(8) NOT NULL DEFAULT 'rank',
    ADD COLUMN pack_id BIGINT     NULL;

-- A training pack bought in the shop. type: level / topic / topic_level. `topics` = comma separated topic keys (NULL = every topic)
CREATE TABLE quiz_packs (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT       NOT NULL,
    type       VARCHAR(12)  NOT NULL,
    difficulty TINYINT      NULL,
    topic      VARCHAR(30)  NULL,
    topics     VARCHAR(500) NULL,
    total      INT          NOT NULL,
    remaining  INT          NOT NULL,
    price      INT          NOT NULL DEFAULT 0,
    status     VARCHAR(10)  NOT NULL DEFAULT 'active',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_quiz_packs_user (user_id, status)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- One row per purchase or sale of the shop, so the daily limits do not depend on the (best effort) game_events log.
-- kind: pack, energy, chest_normal, chest_rare, sell_sticker, sell_item
CREATE TABLE shop_log (
    id         BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT      NOT NULL,
    kind       VARCHAR(20) NOT NULL,
    ref        VARCHAR(60) NULL,
    coins      INT         NOT NULL DEFAULT 0,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_shop_log_user_kind (user_id, kind, created_at)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
