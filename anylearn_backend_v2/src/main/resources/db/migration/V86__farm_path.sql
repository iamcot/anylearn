-- Nong trai anyLEARN: the main path ("Len cap") counts what the player did since a level was reached.
-- One row per player, level and counter kind holds the lifetime counter at that moment; '_init' marks that the snapshot was taken.
CREATE TABLE farm_path_base (
  user_id BIGINT      NOT NULL,
  level   INT         NOT NULL,
  kind    VARCHAR(30) NOT NULL,
  base    INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, level, kind)
);
