-- Vui học (plan 14): stickers belong to collections ("bộ sưu tập"); each collection has its own full-set reward.
CREATE TABLE sticker_collections (
    id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(80)  NOT NULL,
    description  VARCHAR(255) NULL,
    emoji        VARCHAR(16)  NULL,
    image_url    VARCHAR(255) NULL,
    reward_coins INT          NULL,
    sort_order   INT          NOT NULL DEFAULT 0,
    active       TINYINT      NOT NULL DEFAULT 1,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sticker_collections (name, description, emoji, sort_order) VALUES ('Leo ham học', 'Những ngày học vui cùng Leo', '📚', 1);

ALTER TABLE sticker_defs ADD COLUMN collection_id BIGINT NULL;
UPDATE sticker_defs SET collection_id = (SELECT id FROM sticker_collections ORDER BY id LIMIT 1);
ALTER TABLE sticker_defs MODIFY collection_id BIGINT NOT NULL, ADD KEY idx_sticker_defs_collection (collection_id, sort_order);

-- the set reward is now once per person and collection
ALTER TABLE sticker_set_rewards ADD COLUMN collection_id BIGINT NOT NULL DEFAULT 0;
UPDATE sticker_set_rewards SET collection_id = (SELECT id FROM sticker_collections ORDER BY id LIMIT 1);
ALTER TABLE sticker_set_rewards DROP PRIMARY KEY, ADD PRIMARY KEY (user_id, collection_id);
