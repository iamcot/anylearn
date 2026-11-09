-- Nong trai anyLEARN (plan 22), MVP part 2: compost, orders, daily tasks / chapters (counters), neighbours, reminders.
ALTER TABLE farm_crops ADD COLUMN seed_source VARCHAR(12) NOT NULL DEFAULT 'shop';   -- shop | knowledge (only from a Knowledge seed)
ALTER TABLE farm_profiles ADD COLUMN has_dog TINYINT NOT NULL DEFAULT 0, ADD COLUMN push_ignored INT NOT NULL DEFAULT 0;
ALTER TABLE farm_plots ADD COLUMN stolen INT NOT NULL DEFAULT 0;
ALTER TABLE farm_day_stats ADD COLUMN knowledge_seed TINYINT NOT NULL DEFAULT 0;

CREATE TABLE farm_compost (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT   NOT NULL,
  ready_at     DATETIME NOT NULL,
  collected_at DATETIME NULL,
  KEY idx_farm_compost_user (user_id, collected_at)
);
CREATE TABLE farm_orders (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT       NOT NULL,
  slot       INT          NOT NULL,
  items_json VARCHAR(500) NOT NULL,       -- {"crop_key": units}
  xp         INT          NOT NULL,
  coins      INT          NOT NULL,
  status     VARCHAR(10)  NOT NULL DEFAULT 'open',   -- open | done | skipped
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  done_at    DATETIME     NULL,
  KEY idx_farm_order_user (user_id, status)
);
-- What the player did, per day and kind: drives the daily tasks and the chapter quests (nothing is counted twice or by hand).
CREATE TABLE farm_counters (
  user_id BIGINT      NOT NULL,
  day     DATE        NOT NULL,
  kind    VARCHAR(24) NOT NULL,           -- plant | plant_magic | water | fertilize | harvest | sell | order | compost | help | visit | steal
  n       INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day, kind)
);
CREATE TABLE farm_claims (
  user_id    BIGINT       NOT NULL,
  claim_key  VARCHAR(60)  NOT NULL,       -- 'task:2026-11-09:0', 'taskbox:2026-11-09', 'chapter:1'
  claimed_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, claim_key)
);
CREATE TABLE farm_neighbors (
  user_id     BIGINT   NOT NULL,
  neighbor_id BIGINT   NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, neighbor_id)
);
CREATE TABLE farm_social_log (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_id   BIGINT      NOT NULL,
  owner_id   BIGINT      NOT NULL,
  day        DATE        NOT NULL,
  kind       VARCHAR(12) NOT NULL,        -- water | fertilize | steal | caught
  slot       INT         NULL,
  item_key   VARCHAR(60) NULL,
  qty        INT         NOT NULL DEFAULT 0,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_farm_social_actor (actor_id, day, kind),
  KEY idx_farm_social_owner (owner_id, day, kind)
);
CREATE TABLE farm_push_log (
  user_id BIGINT   NOT NULL,
  day     DATE     NOT NULL,
  sent_at DATETIME NOT NULL,
  PRIMARY KEY (user_id, day)
);

INSERT INTO farm_crops (crop_key, name, category, grow_minutes, water_needs, seed_price, unit_price, base_yield, xp, unlock_level, stealable, emoji, description, sort_order, seed_source) VALUES
 ('cay_tri_thuc',      'Cây Tri thức',          'magic',  1440, 2, 0,  12, 4, 45, 3,  0, '📚', 'Chỉ trồng từ Hạt Tri thức, nhận khi bé đi học hoặc học video', 55, 'knowledge'),
 ('day_so_dem',        'Dây leo số đếm',        'magic',  120,  1, 10, 3,  4, 8,  6,  0, '🔢', 'Quả hình số 1, 2, 3 treo trên dây', 75, 'shop'),
 ('huong_duong_cuoi',  'Hướng dương mặt cười',  'flower', 240,  2, 14, 4,  4, 12, 6,  1, '🌻', 'Nhụy là khuôn mặt cười, quay theo Leo', 85, 'shop'),
 ('ot_tia_lua',        'Ớt tia lửa',            'veg',    120,  1, 10, 3,  4, 8,  8,  0, '🌶️', 'Quả đỏ có tia lửa nhỏ lách tách', 95, 'shop'),
 ('tulip_anh_trang',   'Tulip ánh trăng',       'flower', 480,  2, 20, 6,  4, 20, 9,  1, '🌷', 'Cánh bạc xanh, nở sáng hơn ban đêm', 105, 'shop'),
 ('bi_den_long',       'Bí ngô đèn lồng',       'veg',    720,  2, 27, 8,  4, 28, 7,  0, '🎃', 'Phát sáng ấm áp ban đêm', 115, 'shop');
