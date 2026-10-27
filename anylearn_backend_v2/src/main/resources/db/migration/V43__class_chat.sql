-- Class chat (plan 11): one room per course, members are the accounts with an active enrollment in it (any class),
-- plus the partner of the course (moderator). Reports and bans are handled in the back office.
CREATE TABLE `chat_rooms` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `item_id` bigint NOT NULL,
  `title` varchar(255) NOT NULL,
  `is_locked` tinyint NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_chat_rooms_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `chat_members` (
  `room_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'member' COMMENT 'member / moderator',
  `display_name` varchar(100) NULL COMMENT 'chosen on first entry, with rules_accepted_at',
  `class_label` varchar(150) NULL COMMENT 'the member''s class(es) of this course, shown after the name',
  `rules_accepted_at` datetime NULL,
  `last_read_message_id` bigint NULL,
  `muted_until` datetime NULL,
  `banned` tinyint NOT NULL DEFAULT 0,
  `joined_at` datetime NOT NULL,
  `left_at` datetime NULL,
  PRIMARY KEY (`room_id`, `user_id`),
  KEY `idx_chat_members_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `chat_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `room_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'text' COMMENT 'text / announcement / system',
  `body` text NULL,
  `reply_to_id` bigint NULL,
  `is_hidden` tinyint NOT NULL DEFAULT 0,
  `hidden_by` bigint NULL,
  `hidden_at` datetime NULL,
  `is_pinned` tinyint NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_chat_messages_room` (`room_id`, `id`),
  KEY `idx_chat_messages_user` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `chat_reports` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `message_id` bigint NOT NULL,
  `reporter_id` bigint NOT NULL,
  `reason` varchar(255) NULL,
  `status` varchar(20) NOT NULL DEFAULT 'open' COMMENT 'open / hidden / dismissed',
  `handled_by` bigint NULL,
  `handled_at` datetime NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_chat_reports_once` (`message_id`, `reporter_id`),
  KEY `idx_chat_reports_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
