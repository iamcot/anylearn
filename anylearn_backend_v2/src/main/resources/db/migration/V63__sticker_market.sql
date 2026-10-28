-- Vui học (plan 15, part B): sticker market. "I have a, b, c and need x": a listing locks the offered copies until it closes.
CREATE TABLE sticker_listings (
    id                BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id           BIGINT      NOT NULL,
    want_sticker_id   BIGINT      NOT NULL,
    status            VARCHAR(12) NOT NULL DEFAULT 'open',
    expires_at        DATETIME    NOT NULL,
    created_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    done_with_user_id BIGINT      NULL,
    done_sticker_id   BIGINT      NULL,
    KEY idx_sticker_listings_user (user_id, status),
    KEY idx_sticker_listings_status (status, expires_at)
);

CREATE TABLE sticker_listing_offers (
    listing_id BIGINT NOT NULL,
    sticker_id BIGINT NOT NULL,
    PRIMARY KEY (listing_id, sticker_id),
    KEY idx_sticker_listing_offers_sticker (sticker_id)
);
