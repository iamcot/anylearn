-- Vui học (plan 14, phase 3): sticker album, trades between friends, the welcome pack of invited people and a basic risk score.
CREATE TABLE sticker_defs (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(80)  NOT NULL,
    description VARCHAR(255) NULL,
    emoji       VARCHAR(16)  NULL,
    image_url   VARCHAR(500) NULL,
    rarity      VARCHAR(10)  NOT NULL DEFAULT 'common',
    drop_weight INT          NOT NULL DEFAULT 10,
    active      TINYINT(1)   NOT NULL DEFAULT 1,
    sort_order  INT          NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_stickers (
    user_id    BIGINT   NOT NULL,
    sticker_id BIGINT   NOT NULL,
    qty        INT      NOT NULL DEFAULT 0,
    first_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, sticker_id),
    KEY idx_user_stickers_sticker (sticker_id)
);

-- one row per copy received; locked_until keeps a welcome-pack copy out of trades for a week
CREATE TABLE sticker_grants (
    id           BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT      NOT NULL,
    sticker_id   BIGINT      NOT NULL,
    source       VARCHAR(20) NOT NULL,
    ref          VARCHAR(60) NULL,
    locked_until DATETIME    NULL,
    revoked      TINYINT(1)  NOT NULL DEFAULT 0,
    created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_sticker_grants_user (user_id, sticker_id),
    KEY idx_sticker_grants_created (created_at)
);

CREATE TABLE sticker_offers (
    id           BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    from_user    BIGINT      NOT NULL,
    to_user      BIGINT      NOT NULL,
    give_sticker BIGINT      NOT NULL,
    want_sticker BIGINT      NOT NULL,
    status       VARCHAR(12) NOT NULL DEFAULT 'pending',
    created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at   DATETIME    NOT NULL,
    decided_at   DATETIME    NULL,
    KEY idx_sticker_offers_to (to_user, status),
    KEY idx_sticker_offers_from (from_user, status)
);

CREATE TABLE sticker_trades (
    id         BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    a_user     BIGINT      NOT NULL,
    b_user     BIGINT      NOT NULL,
    pair_key   VARCHAR(40) NOT NULL,
    a_sticker  BIGINT      NOT NULL,
    b_sticker  BIGINT      NOT NULL,
    status     VARCHAR(12) NOT NULL DEFAULT 'done',
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_sticker_trades_pair (pair_key, created_at),
    KEY idx_sticker_trades_a (a_user, created_at),
    KEY idx_sticker_trades_b (b_user, created_at)
);

CREATE TABLE welcome_packs (
    user_id          BIGINT      NOT NULL PRIMARY KEY,
    inviter_id       BIGINT      NOT NULL,
    step1_at         DATETIME    NULL,
    step2_at         DATETIME    NULL,
    status           VARCHAR(12) NOT NULL DEFAULT 'pending',
    inviter_rewarded TINYINT(1)  NOT NULL DEFAULT 0,
    created_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_welcome_packs_inviter (inviter_id, status)
);

CREATE TABLE device_ids (
    id         BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT      NOT NULL,
    device_id  VARCHAR(64) NOT NULL,
    ip         VARCHAR(64) NULL,
    first_seen DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_device_user (user_id, device_id),
    KEY idx_device_ids_device (device_id),
    KEY idx_device_ids_ip (ip, first_seen)
);

CREATE TABLE risk_flags (
    user_id    BIGINT        NOT NULL PRIMARY KEY,
    score      INT           NOT NULL DEFAULT 0,
    reasons    VARCHAR(1000) NULL,
    status     VARCHAR(10)   NOT NULL DEFAULT 'open',
    updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sticker_defs (name, description, emoji, rarity, drop_weight, sort_order) VALUES
 ('Ali đọc sách',   'Ali chăm chỉ mở sách mỗi ngày',  '📖', 'common', 20, 1),
 ('Ali tập vẽ',     'Một nét vẽ vui cho hôm nay',      '🎨', 'common', 20, 2),
 ('Ali hát ca',     'Giọng hát của Ali vang cả lớp',   '🎤', 'common', 20, 3),
 ('Ali làm toán',   'Một, hai, ba, đúng rồi!',         '🧮', 'common', 20, 4),
 ('Ali thí nghiệm', 'Khoa học vui cùng Ali',           '🔬', 'common', 20, 5),
 ('Ali đá bóng',    'Sút nào, vào!',                   '⚽', 'common', 20, 6),
 ('Ali học tiếng Anh', 'Hello, I am Ali',              '🔤', 'common', 20, 7),
 ('Ali ghi chép',   'Ghi lại điều hay mỗi ngày',       '✏️', 'common', 20, 8),
 ('Ali giành cúp',  'Cúp của bé chăm học',             '🏆', 'rare', 6, 9),
 ('Ali tên lửa',    'Bay lên cùng ước mơ',             '🚀', 'rare', 6, 10),
 ('Ali ngôi sao',   'Tỏa sáng như một ngôi sao',       '🌟', 'rare', 6, 11),
 ('Ali vương miện', 'Vua của những câu hỏi',           '👑', 'epic', 2, 12);

-- the full-set reward is given once per person
CREATE TABLE sticker_set_rewards (
    user_id    BIGINT   NOT NULL PRIMARY KEY,
    points     INT      NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
