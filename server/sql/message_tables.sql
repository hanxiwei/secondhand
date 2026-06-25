CREATE TABLE IF NOT EXISTS `message_session` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_id` bigint DEFAULT NULL,
  `buyer_id` bigint NOT NULL,
  `seller_id` bigint NOT NULL,
  `last_message` varchar(500) DEFAULT NULL,
  `last_message_at` datetime DEFAULT NULL,
  `buyer_unread_count` int NOT NULL DEFAULT 0,
  `seller_unread_count` int NOT NULL DEFAULT 0,
  `status` tinyint NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session_buyer_seller_product` (`buyer_id`, `seller_id`, `product_id`),
  KEY `idx_session_last_message_at` (`last_message_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `message` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `session_id` bigint DEFAULT NULL,
  `sender_id` bigint DEFAULT NULL,
  `receiver_id` bigint NOT NULL,
  `product_id` bigint DEFAULT NULL,
  `message_type` tinyint NOT NULL DEFAULT 1,
  `content` text NOT NULL,
  `is_read` tinyint NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_message_session_id` (`session_id`),
  KEY `idx_message_receiver_id` (`receiver_id`),
  KEY `idx_message_receiver_read` (`receiver_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
