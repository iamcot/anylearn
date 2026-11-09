-- Nông trại anyLEARN (plan 22), part 22.1/22.2: crops catalog, one profile per player, plots, inventory, day stats.
CREATE TABLE farm_crops (
  crop_key      VARCHAR(40) PRIMARY KEY,
  name          VARCHAR(80)  NOT NULL,
  category      VARCHAR(16)  NOT NULL DEFAULT 'veg',     -- veg | flower | magic | tree | season
  grow_minutes  INT          NOT NULL,
  water_needs   INT          NOT NULL DEFAULT 1,
  seed_price    INT          NOT NULL,
  unit_price    INT          NOT NULL,
  base_yield    INT          NOT NULL DEFAULT 4,
  xp            INT          NOT NULL DEFAULT 1,
  unlock_level  INT          NOT NULL DEFAULT 1,
  stealable     TINYINT      NOT NULL DEFAULT 0,
  emoji         VARCHAR(16)  NULL,
  image_url     VARCHAR(255) NULL,
  description   VARCHAR(255) NULL,
  sort_order    INT          NOT NULL DEFAULT 0,
  active        TINYINT      NOT NULL DEFAULT 1
);
CREATE TABLE farm_profiles (
  user_id       BIGINT PRIMARY KEY,
  level         INT      NOT NULL DEFAULT 1,
  xp            BIGINT   NOT NULL DEFAULT 0,
  plots         INT      NOT NULL DEFAULT 4,
  allow_steal   TINYINT  NOT NULL DEFAULT 1,
  last_visit_at DATETIME NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE farm_plots (
  user_id        BIGINT NOT NULL,
  slot           INT    NOT NULL,
  crop_key       VARCHAR(40) NULL,
  planted_at     DATETIME NULL,
  grow_minutes   INT NULL,
  water_needs    INT NOT NULL DEFAULT 0,
  waters_done    INT NOT NULL DEFAULT 0,
  missed_waters  INT NOT NULL DEFAULT 0,
  lost_seconds   INT NOT NULL DEFAULT 0,
  fertilized     TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, slot)
);
CREATE TABLE farm_inventory (
  user_id      BIGINT NOT NULL,
  item_key     VARCHAR(60) NOT NULL,   -- crop_key, 'fertilizer', 'seed:{crop_key}'
  qty_own      INT NOT NULL DEFAULT 0,
  qty_received INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, item_key)
);
CREATE TABLE farm_day_stats (
  user_id     BIGINT NOT NULL,
  day         DATE   NOT NULL,
  coins_in    INT NOT NULL DEFAULT 0,
  coins_spent INT NOT NULL DEFAULT 0,
  sold_json   VARCHAR(1000) NULL,      -- {"crop_key": units sold today}
  PRIMARY KEY (user_id, day)
);

INSERT INTO farm_crops (crop_key, name, category, grow_minutes, water_needs, seed_price, unit_price, base_yield, xp, unlock_level, stealable, emoji, description, sort_order) VALUES
 ('rau_mam',          'Rau mầm sương mai',        'veg',    5,   0, 3,  1,  4, 2,  1, 0, '🌱', 'Mầm nhỏ đội giọt sương lấp lánh', 10),
 ('ca_rot_cau_vong',  'Cà rốt cầu vồng',          'veg',    30,  1, 7,  2,  4, 4,  1, 0, '🥕', 'Củ có sọc 7 màu', 20),
 ('bap_rang',         'Bắp rang nổ',              'veg',    120, 1, 10, 3,  4, 8,  2, 0, '🌽', 'Chín là hạt bắp nổ bung thành bỏng ngô', 30),
 ('hoa_nang_mai',     'Hoa nắng mai',             'flower', 30,  1, 7,  2,  4, 4,  2, 1, '🌼', 'Cánh vàng tỏa tia như mặt trời nhỏ', 40),
 ('khoai_cuoi',       'Khoai lang tím mặt cười',  'veg',    240, 2, 14, 4,  4, 12, 3, 0, '🍠', 'Củ tím có khuôn mặt cười', 50),
 ('hoa_not_nhac',     'Hoa nốt nhạc',             'flower', 120, 1, 10, 3,  4, 8,  4, 1, '🎵', 'Cánh hình nốt nhạc, rung khi chạm', 60),
 ('cay_chu_cai',      'Cây chữ cái',              'magic',  240, 2, 14, 4,  4, 12, 5, 0, '🔤', 'Quả là chữ cái nhiều màu', 70),
 ('ca_chua_bong_bay', 'Cà chua bóng bay',         'veg',    480, 2, 20, 6,  4, 20, 5, 0, '🍅', 'Quả chín lơ lửng như bóng bay', 80);
