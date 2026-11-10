-- Nông trại: perennial trees (3 tree slots that open at levels 10, 11 and 12). A tree is planted once, grows, then gives fruit every cycle until its cycles are used up.
ALTER TABLE farm_crops ADD COLUMN cycle_minutes INT NULL;   -- trees only: minutes between two harvests
ALTER TABLE farm_crops ADD COLUMN cycles INT NULL;          -- trees only: how many harvests before the tree rests

CREATE TABLE farm_trees (
  user_id        BIGINT      NOT NULL,
  slot           INT         NOT NULL,
  crop_key       VARCHAR(40) NOT NULL,
  planted_at     DATETIME    NOT NULL,
  next_ready_at  DATETIME    NOT NULL,
  harvests_done  INT         NOT NULL DEFAULT 0,
  cycles         INT         NOT NULL,
  PRIMARY KEY (user_id, slot)
);

-- crop_key = the name of the picture set (public/farm/<key>_sapling|grown|fruiting|resting|product). The price is the cost to plant it.
INSERT INTO farm_crops (crop_key, name, category, grow_minutes, water_needs, seed_price, unit_price, base_yield, xp, unlock_level, stealable, emoji, description, sort_order, seed_source, cycle_minutes, cycles) VALUES
 ('bui_dau_sao_bang', 'Bụi dâu sao băng',   'tree', 1440, 0, 45,  4,  3, 6,  10, 0, '🍓', 'Quả dâu lấp lánh như sao băng, ra quả mỗi 8 giờ',    200, 'shop', 480, 12),
 ('cay_cam_mat_troi', 'Cây cam mặt trời',   'tree', 2880, 0, 60,  6,  3, 8,  10, 0, '🍊', 'Quả cam sáng như mặt trời nhỏ, ra quả mỗi 12 giờ',   210, 'shop', 720, 10),
 ('cay_tao_ngoi_sao', 'Cây táo ngôi sao',   'tree', 4320, 0, 80,  8,  3, 10, 10, 0, '🍎', 'Ruột táo hình ngôi sao, ra quả mỗi 12 giờ',          220, 'shop', 720, 10),
 ('cay_thong_keo_gay','Cây thông kẹo gậy',  'tree', 4320, 0, 100, 12, 3, 12, 10, 0, '🎄', 'Cành treo kẹo gậy sọc đỏ trắng, ra quả mỗi 12 giờ',  230, 'shop', 720, 8);
