-- Vui hoc (plan 18): "dau truong rieng", an arena the back office creates and starts by hand.
-- Automatic arenas stay one per day; custom ones may share a day, so the unique day moves to a generated column that is NULL for custom rows.
ALTER TABLE arena_sessions
    ADD COLUMN kind        VARCHAR(8)  NOT NULL DEFAULT 'auto' AFTER id,
    ADD COLUMN title       VARCHAR(80) NULL,
    ADD COLUMN expected_at DATETIME    NULL,
    ADD COLUMN closed_at   DATETIME    NULL,
    ADD COLUMN auto_day    DATE GENERATED ALWAYS AS (CASE WHEN kind = 'auto' THEN day ELSE NULL END) STORED,
    DROP INDEX uq_arena_session_day,
    ADD UNIQUE KEY uq_arena_auto_day (auto_day),
    ADD KEY idx_arena_kind (kind, status);
