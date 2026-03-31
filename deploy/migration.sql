-- ============================================================
-- Real Estate Bot — Full Production Migration
-- MySQL 8.0+ / MariaDB 10.6+
-- تشغيل: mysql -u root -p realestate_db < migration.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

-- ─── جدول المستخدمين ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `open_id` VARCHAR(255) NOT NULL UNIQUE,
  `name` VARCHAR(255),
  `avatar` TEXT,
  `email` VARCHAR(255),
  `role` ENUM('super_admin','admin','owner','broker','tenant','user') NOT NULL DEFAULT 'user',
  `company_id` INT,
  `login_method` VARCHAR(50) DEFAULT 'manus',
  `password_hash` VARCHAR(255),
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
  `updated_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول الشركات ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `companies` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `name_en` VARCHAR(255),
  `cr_number` VARCHAR(50),
  `vat_number` VARCHAR(50),
  `phone` VARCHAR(20),
  `email` VARCHAR(255),
  `address` TEXT,
  `city` VARCHAR(100),
  `logo_url` TEXT,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
  `updated_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول الباقات ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `plans` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `name_en` VARCHAR(100),
  `description` TEXT,
  `price_monthly` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `price_yearly` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `max_properties` INT DEFAULT 10,
  `max_units` INT DEFAULT 50,
  `max_tenants` INT DEFAULT 100,
  `max_users` INT DEFAULT 5,
  `trial_days` INT DEFAULT 14,
  `is_recommended` BOOLEAN DEFAULT FALSE,
  `is_active` BOOLEAN DEFAULT TRUE,
  `features_json` JSON,
  `limits_json` JSON,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول الاشتراكات ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `plan_id` INT NOT NULL,
  `status` ENUM('trial','active','past_due','cancelled','expired','grace_period') NOT NULL DEFAULT 'trial',
  `billing_cycle` ENUM('monthly','yearly') DEFAULT 'monthly',
  `start_date` BIGINT,
  `end_date` BIGINT,
  `trial_end` BIGINT,
  `grace_period_end` BIGINT,
  `cancelled_at` BIGINT,
  `auto_renew` BOOLEAN DEFAULT TRUE,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
  `updated_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول ميزات الباقات ───────────────────────────────────
CREATE TABLE IF NOT EXISTS `subscription_features` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `plan_id` INT NOT NULL,
  `feature_key` VARCHAR(100) NOT NULL,
  `enabled` BOOLEAN DEFAULT TRUE,
  `limit_value` INT,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول فواتير الاشتراك ─────────────────────────────────
CREATE TABLE IF NOT EXISTS `subscription_invoices` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `subscription_id` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(3) DEFAULT 'SAR',
  `status` ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
  `billing_period_start` BIGINT,
  `billing_period_end` BIGINT,
  `paid_at` BIGINT,
  `invoice_number` VARCHAR(50),
  `payment_method` VARCHAR(50),
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول مالكي العقارات ──────────────────────────────────
CREATE TABLE IF NOT EXISTS `property_owners` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `national_id` VARCHAR(20),
  `phone` VARCHAR(20),
  `email` VARCHAR(255),
  `bank_account` VARCHAR(50),
  `iban` VARCHAR(34),
  `bank_name` VARCHAR(100),
  `management_fee_rate` DECIMAL(5,2) DEFAULT 10.00,
  `notes` TEXT,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
  `updated_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول الوسطاء ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `brokers` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `email` VARCHAR(255),
  `national_id` VARCHAR(20),
  `fal_license` VARCHAR(50),
  `commission_rate` DECIMAL(5,2) DEFAULT 2.50,
  `commission_structure` VARCHAR(50) DEFAULT 'percentage',
  `performance_score` DECIMAL(3,1) DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
  `updated_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول العقارات ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `properties` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `owner_id` INT,
  `title_ar` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255),
  `property_type` VARCHAR(50),
  `address` TEXT,
  `city` VARCHAR(100),
  `district` VARCHAR(100),
  `latitude` DECIMAL(10,8),
  `longitude` DECIMAL(11,8),
  `total_units` INT DEFAULT 1,
  `built_year` INT,
  `total_area` DECIMAL(10,2),
  `description` TEXT,
  `status` ENUM('active','inactive','sold','under_maintenance') DEFAULT 'active',
  `deed_number` VARCHAR(50),
  `deed_date` BIGINT,
  `image_url` TEXT,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
  `updated_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول الوحدات ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `units` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `property_id` INT NOT NULL,
  `unit_number` VARCHAR(50) NOT NULL,
  `unit_type` VARCHAR(50),
  `floor` INT,
  `area` DECIMAL(10,2),
  `bedrooms` INT DEFAULT 0,
  `bathrooms` INT DEFAULT 0,
  `rent_amount` DECIMAL(10,2),
  `status` ENUM('vacant','occupied','maintenance','reserved') DEFAULT 'vacant',
  `description` TEXT,
  `amenities` JSON,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
  `updated_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول المستأجرين ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `national_id` VARCHAR(20),
  `phone` VARCHAR(20),
  `email` VARCHAR(255),
  `nationality` VARCHAR(50),
  `occupation` VARCHAR(100),
  `employer` VARCHAR(255),
  `emergency_contact` VARCHAR(255),
  `emergency_phone` VARCHAR(20),
  `notes` TEXT,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
  `updated_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول العقود ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `contracts` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `contract_number` VARCHAR(50) UNIQUE,
  `property_id` INT NOT NULL,
  `unit_id` INT NOT NULL,
  `tenant_id` INT NOT NULL,
  `owner_id` INT,
  `broker_id` INT,
  `contract_type` ENUM('residential','commercial','industrial') DEFAULT 'residential',
  `start_date` BIGINT NOT NULL,
  `end_date` BIGINT NOT NULL,
  `rent_amount` DECIMAL(10,2) NOT NULL,
  `payment_frequency` ENUM('monthly','quarterly','semi_annual','annual') DEFAULT 'monthly',
  `payment_day` INT DEFAULT 1,
  `deposit_amount` DECIMAL(10,2) DEFAULT 0,
  `commission_rate` DECIMAL(5,2) DEFAULT 0,
  `late_fee_rate` DECIMAL(5,2) DEFAULT 5.00,
  `escalation_rate` DECIMAL(5,2) DEFAULT 0,
  `status` ENUM('active','expired','terminated','pending','archived') DEFAULT 'active',
  `ejari_number` VARCHAR(50),
  `notes` TEXT,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
  `updated_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول الدفعات ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `contract_id` INT NOT NULL,
  `tenant_id` INT,
  `amount` DECIMAL(10,2) NOT NULL,
  `paid_amount` DECIMAL(10,2) DEFAULT 0,
  `due_date` BIGINT NOT NULL,
  `paid_date` BIGINT,
  `payment_method` VARCHAR(50),
  `reference_number` VARCHAR(100),
  `status` ENUM('pending','paid','partial','overdue','cancelled') DEFAULT 'pending',
  `late_fee_rate` DECIMAL(5,2) DEFAULT 0,
  `late_fee_amount` DECIMAL(10,2) DEFAULT 0,
  `days_overdue` INT DEFAULT 0,
  `escalation_level` INT DEFAULT 0,
  `reminder_sent` BOOLEAN DEFAULT FALSE,
  `last_reminder_sent` BIGINT,
  `period_covered` VARCHAR(50),
  `notes` TEXT,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
  `updated_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول المصروفات ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `property_id` INT,
  `unit_id` INT,
  `category` VARCHAR(100),
  `description` TEXT,
  `amount` DECIMAL(10,2) NOT NULL,
  `date` BIGINT NOT NULL,
  `vendor` VARCHAR(255),
  `receipt_url` TEXT,
  `status` ENUM('pending','approved','paid','rejected') DEFAULT 'pending',
  `created_by` INT,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
  `updated_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول طلبات الصيانة ───────────────────────────────────
CREATE TABLE IF NOT EXISTS `maintenance_requests` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `property_id` INT,
  `unit_id` INT,
  `tenant_id` INT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(100),
  `priority` ENUM('low','medium','high','urgent') DEFAULT 'medium',
  `status` ENUM('open','in_progress','completed','cancelled') DEFAULT 'open',
  `assigned_to` VARCHAR(255),
  `vendor_name` VARCHAR(255),
  `cost` DECIMAL(10,2),
  `scheduled_date` BIGINT,
  `completion_date` BIGINT,
  `notes` TEXT,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
  `updated_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول تحويلات المالك ──────────────────────────────────
CREATE TABLE IF NOT EXISTS `owner_transfers` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `owner_id` INT NOT NULL,
  `property_id` INT,
  `payment_id` INT,
  `contract_id` INT,
  `gross_amount` DECIMAL(10,2) NOT NULL,
  `management_fee` DECIMAL(10,2) DEFAULT 0,
  `net_amount` DECIMAL(10,2) NOT NULL,
  `transfer_date` BIGINT,
  `status` ENUM('pending','transferred','cancelled') DEFAULT 'pending',
  `reference` VARCHAR(100),
  `notes` TEXT,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول السندات ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `vouchers` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `voucher_number` VARCHAR(50) UNIQUE,
  `voucher_type` ENUM('receipt','payment') NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `payer_name` VARCHAR(255),
  `payer_phone` VARCHAR(20),
  `description` TEXT,
  `category` VARCHAR(100),
  `payment_method` VARCHAR(50),
  `reference_number` VARCHAR(100),
  `date` BIGINT NOT NULL,
  `property_id` INT,
  `contract_id` INT,
  `status` ENUM('draft','confirmed','cancelled') DEFAULT 'confirmed',
  `created_by` INT,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول الفواتير ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `invoice_number` VARCHAR(50) UNIQUE,
  `contract_id` INT,
  `tenant_id` INT,
  `amount` DECIMAL(10,2) NOT NULL,
  `vat_amount` DECIMAL(10,2) DEFAULT 0,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `due_date` BIGINT,
  `paid_date` BIGINT,
  `status` ENUM('draft','sent','paid','overdue','cancelled') DEFAULT 'draft',
  `items` JSON,
  `notes` TEXT,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول العملاء المحتملين ───────────────────────────────
CREATE TABLE IF NOT EXISTS `leads` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `name` VARCHAR(255),
  `phone` VARCHAR(20),
  `email` VARCHAR(255),
  `service_type` VARCHAR(100),
  `source` VARCHAR(100),
  `status` ENUM('new','contacted','qualified','converted','lost') DEFAULT 'new',
  `notes` TEXT,
  `assigned_to` INT,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
  `updated_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول سجل النشاط ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS `activity_log` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT,
  `user_id` INT,
  `action` VARCHAR(255) NOT NULL,
  `entity_type` VARCHAR(100),
  `entity_id` INT,
  `details` JSON,
  `severity` ENUM('info','warning','error','critical') DEFAULT 'info',
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول إعدادات النظام ──────────────────────────────────
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `key` VARCHAR(100) NOT NULL,
  `value` TEXT,
  `updated_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
  UNIQUE KEY `company_key` (`company_id`, `key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── جدول مفاتيح API ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS `api_keys` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `key_hash` VARCHAR(255) NOT NULL UNIQUE,
  `permissions` JSON,
  `last_used_at` BIGINT,
  `expires_at` BIGINT,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Indexes للأداء ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_properties_company ON properties(company_id);
CREATE INDEX IF NOT EXISTS idx_units_company ON units(company_id);
CREATE INDEX IF NOT EXISTS idx_units_property ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_company ON tenants(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_company ON contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_unit ON contracts(unit_id);
CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_contract ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_expenses_company ON expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_company ON maintenance_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_company ON activity_log(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON subscriptions(company_id);

SET FOREIGN_KEY_CHECKS = 1;

-- ─── بيانات أولية: الباقات ────────────────────────────────
INSERT IGNORE INTO `plans` (`id`, `name`, `name_en`, `description`, `price_monthly`, `price_yearly`, `max_properties`, `max_units`, `max_tenants`, `max_users`, `trial_days`, `is_recommended`) VALUES
(1, 'مبتدئ', 'Starter', 'مناسب للمكاتب الصغيرة', 99.00, 990.00, 5, 20, 50, 2, 14, FALSE),
(2, 'احترافي', 'Professional', 'مناسب للشركات المتوسطة', 299.00, 2990.00, 25, 150, 500, 10, 14, TRUE),
(3, 'مؤسسي', 'Enterprise', 'للشركات الكبيرة بدون حدود', 799.00, 7990.00, -1, -1, -1, -1, 30, FALSE);

-- ─── بيانات أولية: ميزات الباقات ─────────────────────────
INSERT IGNORE INTO `subscription_features` (`plan_id`, `feature_key`, `enabled`, `limit_value`) VALUES
-- مبتدئ
(1, 'vouchers', TRUE, NULL),
(1, 'reports_basic', TRUE, NULL),
(1, 'reports_advanced', FALSE, NULL),
(1, 'api_access', FALSE, NULL),
(1, 'backup', FALSE, NULL),
-- احترافي
(2, 'vouchers', TRUE, NULL),
(2, 'reports_basic', TRUE, NULL),
(2, 'reports_advanced', TRUE, NULL),
(2, 'api_access', TRUE, NULL),
(2, 'backup', TRUE, NULL),
-- مؤسسي
(3, 'vouchers', TRUE, NULL),
(3, 'reports_basic', TRUE, NULL),
(3, 'reports_advanced', TRUE, NULL),
(3, 'api_access', TRUE, NULL),
(3, 'backup', TRUE, NULL);
