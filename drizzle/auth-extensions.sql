-- ─── AUTH EXTENSIONS MIGRATION ───────────────────────────────────────────────
-- Run this AFTER the main migration.sql
-- Adds: otp_codes, refresh_tokens, user_passwords

-- OTP codes table
CREATE TABLE IF NOT EXISTS `otp_codes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(320) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `purpose` ENUM('verify_email', 'reset_password', 'login_2fa') NOT NULL,
  `attempts` INT NOT NULL DEFAULT 0,
  `expires_at` BIGINT NOT NULL,
  `used_at` BIGINT,
  `created_at_otp` BIGINT NOT NULL,
  INDEX `idx_otp_email_purpose` (`email`, `purpose`),
  INDEX `idx_otp_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id_rt` INT NOT NULL,
  `token_hash` VARCHAR(128) NOT NULL UNIQUE,
  `expires_at_rt` BIGINT NOT NULL,
  `created_at_rt` BIGINT NOT NULL,
  `revoked_at_rt` BIGINT,
  `user_agent_rt` TEXT,
  `ip_address_rt` VARCHAR(45),
  INDEX `idx_rt_user` (`user_id_rt`),
  INDEX `idx_rt_expires` (`expires_at_rt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User passwords table (standalone email+password auth)
CREATE TABLE IF NOT EXISTS `user_passwords` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id_pw` INT NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `updated_at_pw` BIGINT NOT NULL,
  INDEX `idx_pw_user` (`user_id_pw`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
