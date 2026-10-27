-- Facts the AI read out of a course description for the comparison page (plan 04.6).
-- One row per course; content_hash says which description it was read from, so an edit makes the next view read it again.
CREATE TABLE item_compare_facts (
    item_id      BIGINT       NOT NULL PRIMARY KEY,
    content_hash CHAR(64)     NOT NULL,
    facts_json   TEXT         NOT NULL,
    model        VARCHAR(80)  NOT NULL,
    input_tokens INT          NOT NULL DEFAULT 0,
    output_tokens INT         NOT NULL DEFAULT 0,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
