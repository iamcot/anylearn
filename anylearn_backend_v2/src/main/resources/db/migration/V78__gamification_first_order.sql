-- Plan 21: learner tier, anyLEARN Foundation, system missions ("Hành trình anyLEARN"), first-order and referral rewards.

-- A course a learner finished: found by the system (video 100%, class over with enough attendance),
-- pressed by the parent, or set by an admin. An admin can revoke one; a revoked row is never re-added by the system.
CREATE TABLE IF NOT EXISTS course_completions (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  learner_id    BIGINT NOT NULL,
  item_id       BIGINT NOT NULL,
  enrollment_id BIGINT NULL,
  source        VARCHAR(10) NOT NULL,              -- video / class / parent / admin
  status        VARCHAR(10) NOT NULL DEFAULT 'done', -- done / revoked
  note          VARCHAR(255) NULL,
  completed_at  DATETIME NOT NULL,
  updated_at    DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_course_completions (learner_id, item_id),
  KEY idx_course_completions_item (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- anyLEARN Foundation: two stored numbers (never recomputed from the total), the contributions and the finished houses.
CREATE TABLE IF NOT EXISTS foundation_state (
  id             TINYINT NOT NULL,
  houses_built   INT NOT NULL DEFAULT 0,
  current_amount BIGINT NOT NULL DEFAULT 0,
  total_amount   BIGINT NOT NULL DEFAULT 0,
  updated_at     DATETIME NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO foundation_state (id, houses_built, current_amount, total_amount, updated_at) VALUES (1, 0, 0, 0, NOW());

CREATE TABLE IF NOT EXISTS foundation_contributions (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT NULL,                    -- NULL = anyLEARN itself
  source     VARCHAR(20) NOT NULL,           -- order / milestone / seed / admin
  amount     BIGINT NOT NULL,
  order_id   BIGINT NULL,
  house_no   INT NOT NULL,                   -- the house being built when it came in
  dedup_key  VARCHAR(100) NULL,
  note       VARCHAR(255) NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_foundation_dedup (dedup_key),
  KEY idx_foundation_user (user_id),
  KEY idx_foundation_house (house_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS foundation_houses (
  house_no     INT NOT NULL,
  completed_at DATETIME NOT NULL,
  school       VARCHAR(191) NULL,
  place        VARCHAR(191) NULL,
  opened_on    DATE NULL,
  photo_url    VARCHAR(500) NULL,
  proof_url    VARCHAR(500) NULL,
  note         TEXT NULL,
  PRIMARY KEY (house_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A contributor who asked to be shown as "Một phụ huynh".
CREATE TABLE IF NOT EXISTS foundation_members (
  user_id   BIGINT NOT NULL,
  hide_name TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System missions: a mission or chapter reward is claimed once per account (key = mission key or "chapter:N").
CREATE TABLE IF NOT EXISTS journey_claims (
  user_id     BIGINT NOT NULL,
  mission_key VARCHAR(40) NOT NULL,
  claimed_at  DATETIME NOT NULL,
  PRIMARY KEY (user_id, mission_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- First-order and referral-on-purchase rewards, once per account and kind.
CREATE TABLE IF NOT EXISTS milestone_rewards (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT NOT NULL,
  kind       VARCHAR(30) NOT NULL,           -- first_order / referral_buyer / referral_inviter
  ref_id     BIGINT NOT NULL DEFAULT 0,      -- the order, or the invited account for the inviter
  points     INT NOT NULL DEFAULT 0,
  coins      INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_milestone (user_id, kind, ref_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
