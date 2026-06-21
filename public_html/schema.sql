-- =============================================================================
-- Lar dos Anjos Pet — schema MySQL completo
-- Gerado a partir das migrations Prisma (MySQL 8.0, utf8mb4)
-- Importar via phpMyAdmin (Hostinger) em banco vazio.
-- NAO inclui dados sensiveis. Apos importar, rode o seed da API se necessario.
-- Alternativa: pnpm db:migrate:deploy em banco vazio (sem importar este arquivo).
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `permissions_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `role_id` VARCHAR(36) NOT NULL,
    `permission_id` VARCHAR(36) NOT NULL,

    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `user_id` VARCHAR(36) NOT NULL,
    `role_id` VARCHAR(36) NOT NULL,

    PRIMARY KEY (`user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `refresh_tokens_user_id_idx`(`user_id`),
    INDEX `refresh_tokens_token_hash_idx`(`token_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `password_reset_tokens_user_id_idx`(`user_id`),
    INDEX `password_reset_tokens_token_hash_idx`(`token_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `donors` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `public_name` VARCHAR(255) NULL,
    `cpf_cnpj` VARCHAR(20) NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `birth_date` DATE NULL,
    `zip_code` VARCHAR(20) NULL,
    `address` VARCHAR(255) NULL,
    `address_number` VARCHAR(50) NULL,
    `address_complement` VARCHAR(255) NULL,
    `neighborhood` VARCHAR(100) NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(2) NULL,
    `wants_public_profile` BOOLEAN NOT NULL DEFAULT false,
    `public_display_type` ENUM('FULL_NAME', 'FIRST_NAME_ONLY', 'ANONYMOUS') NOT NULL DEFAULT 'ANONYMOUS',
    `communication_email` BOOLEAN NOT NULL DEFAULT true,
    `communication_whatsapp` BOOLEAN NOT NULL DEFAULT false,
    `asaas_customer_id` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `donors_user_id_key`(`user_id`),
    INDEX `donors_email_idx`(`email`),
    INDEX `donors_cpf_cnpj_idx`(`cpf_cnpj`),
    INDEX `donors_asaas_customer_id_idx`(`asaas_customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `donation_plans` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `value` DECIMAL(10, 2) NOT NULL,
    `description` TEXT NULL,
    `impact_text` VARCHAR(255) NULL,
    `badge_name` VARCHAR(100) NULL,
    `badge_color` VARCHAR(50) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `donation_plans_slug_key`(`slug`),
    INDEX `donation_plans_is_active_idx`(`is_active`),
    INDEX `donation_plans_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` VARCHAR(36) NOT NULL,
    `donor_id` VARCHAR(36) NOT NULL,
    `plan_id` VARCHAR(36) NOT NULL,
    `asaas_subscription_id` VARCHAR(100) NULL,
    `billing_type` ENUM('CREDIT_CARD', 'PIX', 'BOLETO') NOT NULL,
    `value` DECIMAL(10, 2) NOT NULL,
    `cycle` ENUM('MONTHLY') NOT NULL DEFAULT 'MONTHLY',
    `status` ENUM('ACTIVE', 'PENDING', 'INACTIVE', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    `next_due_date` DATE NULL,
    `started_at` DATETIME(3) NULL,
    `canceled_at` DATETIME(3) NULL,
    `cancel_reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subscriptions_asaas_subscription_id_key`(`asaas_subscription_id`),
    INDEX `subscriptions_donor_id_idx`(`donor_id`),
    INDEX `subscriptions_status_idx`(`status`),
    INDEX `subscriptions_asaas_subscription_id_idx`(`asaas_subscription_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(36) NOT NULL,
    `donor_id` VARCHAR(36) NOT NULL,
    `subscription_id` VARCHAR(36) NULL,
    `asaas_payment_id` VARCHAR(100) NOT NULL,
    `type` ENUM('ONETIME', 'RECURRING') NOT NULL,
    `billing_type` ENUM('PIX', 'CREDIT_CARD', 'BOLETO') NOT NULL,
    `value` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'RECEIVED', 'CONFIRMED', 'OVERDUE', 'REFUNDED', 'FAILED', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    `due_date` DATE NOT NULL,
    `paid_at` DATETIME(3) NULL,
    `received_at` DATETIME(3) NULL,
    `invoice_url` VARCHAR(255) NULL,
    `pix_qr_code` LONGTEXT NULL,
    `pix_copy_paste` LONGTEXT NULL,
    `boleto_url` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_asaas_payment_id_key`(`asaas_payment_id`),
    INDEX `payments_donor_id_idx`(`donor_id`),
    INDEX `payments_status_idx`(`status`),
    INDEX `payments_asaas_payment_id_idx`(`asaas_payment_id`),
    INDEX `payments_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pix_settings` (
    `id` VARCHAR(36) NOT NULL,
    `receiver_name` VARCHAR(255) NOT NULL,
    `receiver_city` VARCHAR(100) NOT NULL,
    `pix_key` VARCHAR(255) NOT NULL,
    `pix_key_type` ENUM('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM_KEY') NOT NULL,
    `default_description` VARCHAR(255) NULL,
    `default_txid` VARCHAR(255) NULL,
    `min_amount` DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    `allow_custom_amount` BOOLEAN NOT NULL DEFAULT true,
    `quick_amounts` JSON NULL,
    `instructions` TEXT NULL,
    `require_donor_data` BOOLEAN NOT NULL DEFAULT false,
    `require_receipt_upload` BOOLEAN NOT NULL DEFAULT true,
    `hide_sensitive_details` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `environment` VARCHAR(50) NOT NULL DEFAULT 'PRODUCTION',
    `created_by` VARCHAR(36) NULL,
    `updated_by` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pix_donations` (
    `id` VARCHAR(36) NOT NULL,
    `donor_id` VARCHAR(36) NULL,
    `donor_name` VARCHAR(255) NULL,
    `donor_email` VARCHAR(255) NULL,
    `donor_phone` VARCHAR(50) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `pix_payload` LONGTEXT NOT NULL,
    `pix_qr_code_base64` LONGTEXT NULL,
    `txid` VARCHAR(255) NOT NULL,
    `status` ENUM('PIX_GERADO', 'COMPROVANTE_ENVIADO', 'AGUARDANDO_CONFIRMACAO_MANUAL', 'CONFIRMADO_MANUALMENTE', 'REJEITADO', 'EXPIRADO', 'DUPLICADO') NOT NULL DEFAULT 'PIX_GERADO',
    `wants_public_mural` BOOLEAN NOT NULL DEFAULT false,
    `wants_anonymous` BOOLEAN NOT NULL DEFAULT true,
    `donor_message` TEXT NULL,
    `receipt_file_id` VARCHAR(36) NULL,
    `marked_as_paid_at` DATETIME(3) NULL,
    `manually_confirmed_at` DATETIME(3) NULL,
    `manually_confirmed_by` VARCHAR(36) NULL,
    `rejected_at` DATETIME(3) NULL,
    `rejected_by` VARCHAR(36) NULL,
    `rejection_reason` TEXT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pix_donations_txid_key`(`txid`),
    INDEX `pix_donations_donor_id_idx`(`donor_id`),
    INDEX `pix_donations_status_idx`(`status`),
    INDEX `pix_donations_txid_idx`(`txid`),
    INDEX `pix_donations_created_at_idx`(`created_at`),
    INDEX `pix_donations_donor_email_idx`(`donor_email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pix_payment_confirmations` (
    `id` VARCHAR(36) NOT NULL,
    `pix_donation_id` VARCHAR(36) NOT NULL,
    `action` ENUM('GENERATE', 'ATTACH_RECEIPT', 'MARK_AS_PAID', 'CONFIRM', 'REJECT', 'MARK_DUPLICATE', 'EXPIRE') NOT NULL,
    `previous_status` ENUM('PIX_GERADO', 'COMPROVANTE_ENVIADO', 'AGUARDANDO_CONFIRMACAO_MANUAL', 'CONFIRMADO_MANUALMENTE', 'REJEITADO', 'EXPIRADO', 'DUPLICADO') NULL,
    `new_status` ENUM('PIX_GERADO', 'COMPROVANTE_ENVIADO', 'AGUARDANDO_CONFIRMACAO_MANUAL', 'CONFIRMADO_MANUALMENTE', 'REJEITADO', 'EXPIRADO', 'DUPLICADO') NOT NULL,
    `admin_user_id` VARCHAR(36) NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pix_payment_confirmations_pix_donation_id_idx`(`pix_donation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asaas_webhook_events` (
    `id` VARCHAR(36) NOT NULL,
    `event_id` VARCHAR(255) NOT NULL,
    `event_type` VARCHAR(100) NOT NULL,
    `payload` JSON NOT NULL,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `processed_at` DATETIME(3) NULL,
    `error_message` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `asaas_webhook_events_event_id_key`(`event_id`),
    INDEX `asaas_webhook_events_processed_idx`(`processed`),
    INDEX `asaas_webhook_events_event_type_idx`(`event_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expense_categories` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `icon` VARCHAR(100) NULL,
    `color` VARCHAR(50) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` VARCHAR(36) NOT NULL,
    `category_id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `public_description` TEXT NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `date` DATE NOT NULL,
    `supplier` VARCHAR(255) NULL,
    `receipt_file_id` VARCHAR(36) NULL,
    `is_public` BOOLEAN NOT NULL DEFAULT true,
    `created_by` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `expenses_category_id_idx`(`category_id`),
    INDEX `expenses_date_idx`(`date`),
    INDEX `expenses_is_public_idx`(`is_public`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transparency_reports` (
    `id` VARCHAR(36) NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `summary` TEXT NULL,
    `total_income` DECIMAL(10, 2) NOT NULL,
    `total_expense` DECIMAL(10, 2) NOT NULL,
    `net_balance` DECIMAL(10, 2) NOT NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `transparency_reports_month_year_key`(`month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `animals` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `species` ENUM('DOG', 'CAT', 'OTHER') NOT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'UNKNOWN') NOT NULL,
    `age` VARCHAR(100) NULL,
    `size` ENUM('SMALL', 'MEDIUM', 'LARGE') NULL,
    `status` VARCHAR(100) NOT NULL,
    `story` TEXT NOT NULL,
    `needs` TEXT NULL,
    `cover_image_id` VARCHAR(36) NULL,
    `is_public` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `animals_species_idx`(`species`),
    INDEX `animals_is_public_idx`(`is_public`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `animal_images` (
    `id` VARCHAR(36) NOT NULL,
    `animal_id` VARCHAR(36) NOT NULL,
    `uploaded_file_id` VARCHAR(36) NOT NULL,
    `display_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `animal_images_animal_id_idx`(`animal_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaigns` (
    `id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `goal_amount` DECIMAL(10, 2) NOT NULL,
    `raised_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELED') NOT NULL DEFAULT 'DRAFT',
    `starts_at` DATETIME(3) NULL,
    `ends_at` DATETIME(3) NULL,
    `animal_id` VARCHAR(36) NULL,
    `cover_image_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `campaigns_slug_key`(`slug`),
    INDEX `campaigns_slug_idx`(`slug`),
    INDEX `campaigns_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaign_donations` (
    `id` VARCHAR(36) NOT NULL,
    `campaign_id` VARCHAR(36) NOT NULL,
    `payment_id` VARCHAR(36) NULL,
    `pix_donation_id` VARCHAR(36) NULL,

    INDEX `campaign_donations_campaign_id_idx`(`campaign_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `badges` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(100) NULL,
    `rule_type` ENUM('FIRST_DONATION', 'MONTHS_ACTIVE', 'TOTAL_AMOUNT', 'SUBSCRIPTION', 'MANUAL') NOT NULL,
    `rule_value` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `donor_badges` (
    `id` VARCHAR(36) NOT NULL,
    `donor_id` VARCHAR(36) NOT NULL,
    `badge_id` VARCHAR(36) NOT NULL,
    `awarded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `donor_badges_donor_id_badge_id_key`(`donor_id`, `badge_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `donor_cards` (
    `id` VARCHAR(36) NOT NULL,
    `donor_id` VARCHAR(36) NOT NULL,
    `card_number` VARCHAR(100) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `qr_code_secret` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `donor_cards_card_number_key`(`card_number`),
    INDEX `donor_cards_donor_id_idx`(`donor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `public_mural_entries` (
    `id` VARCHAR(36) NOT NULL,
    `donor_id` VARCHAR(36) NULL,
    `pix_donation_id` VARCHAR(36) NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `plan_name` VARCHAR(100) NULL,
    `impact_months` INTEGER NULL,
    `message` VARCHAR(255) NULL,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `public_mural_entries_is_visible_idx`(`is_visible`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_pages` (
    `id` VARCHAR(36) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `content_pages_slug_key`(`slug`),
    INDEX `content_pages_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faq_items` (
    `id` VARCHAR(36) NOT NULL,
    `question` VARCHAR(255) NOT NULL,
    `answer` TEXT NOT NULL,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `is_published` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `faq_items_is_published_idx`(`is_published`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity` VARCHAR(100) NOT NULL,
    `entity_id` VARCHAR(100) NULL,
    `old_data` JSON NULL,
    `new_data` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_user_id_idx`(`user_id`),
    INDEX `audit_logs_entity_idx`(`entity`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `id` VARCHAR(36) NOT NULL,
    `key` VARCHAR(255) NOT NULL,
    `value` TEXT NOT NULL,
    `description` TEXT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `uploaded_files` (
    `id` VARCHAR(36) NOT NULL,
    `file_key` VARCHAR(255) NOT NULL,
    `bucket_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `uploaded_by` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `uploaded_files_file_key_idx`(`file_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `donors` ADD CONSTRAINT `donors_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_donor_id_fkey` FOREIGN KEY (`donor_id`) REFERENCES `donors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `donation_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_donor_id_fkey` FOREIGN KEY (`donor_id`) REFERENCES `donors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pix_settings` ADD CONSTRAINT `pix_settings_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pix_settings` ADD CONSTRAINT `pix_settings_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pix_donations` ADD CONSTRAINT `pix_donations_donor_id_fkey` FOREIGN KEY (`donor_id`) REFERENCES `donors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pix_donations` ADD CONSTRAINT `pix_donations_receipt_file_id_fkey` FOREIGN KEY (`receipt_file_id`) REFERENCES `uploaded_files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pix_donations` ADD CONSTRAINT `pix_donations_manually_confirmed_by_fkey` FOREIGN KEY (`manually_confirmed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pix_donations` ADD CONSTRAINT `pix_donations_rejected_by_fkey` FOREIGN KEY (`rejected_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pix_payment_confirmations` ADD CONSTRAINT `pix_payment_confirmations_pix_donation_id_fkey` FOREIGN KEY (`pix_donation_id`) REFERENCES `pix_donations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pix_payment_confirmations` ADD CONSTRAINT `pix_payment_confirmations_admin_user_id_fkey` FOREIGN KEY (`admin_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `expense_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_receipt_file_id_fkey` FOREIGN KEY (`receipt_file_id`) REFERENCES `uploaded_files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `animals` ADD CONSTRAINT `animals_cover_image_id_fkey` FOREIGN KEY (`cover_image_id`) REFERENCES `uploaded_files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `animal_images` ADD CONSTRAINT `animal_images_animal_id_fkey` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `animal_images` ADD CONSTRAINT `animal_images_uploaded_file_id_fkey` FOREIGN KEY (`uploaded_file_id`) REFERENCES `uploaded_files`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_animal_id_fkey` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_cover_image_id_fkey` FOREIGN KEY (`cover_image_id`) REFERENCES `uploaded_files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_donations` ADD CONSTRAINT `campaign_donations_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_donations` ADD CONSTRAINT `campaign_donations_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_donations` ADD CONSTRAINT `campaign_donations_pix_donation_id_fkey` FOREIGN KEY (`pix_donation_id`) REFERENCES `pix_donations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `donor_badges` ADD CONSTRAINT `donor_badges_donor_id_fkey` FOREIGN KEY (`donor_id`) REFERENCES `donors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `donor_badges` ADD CONSTRAINT `donor_badges_badge_id_fkey` FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `donor_cards` ADD CONSTRAINT `donor_cards_donor_id_fkey` FOREIGN KEY (`donor_id`) REFERENCES `donors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `public_mural_entries` ADD CONSTRAINT `public_mural_entries_donor_id_fkey` FOREIGN KEY (`donor_id`) REFERENCES `donors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `public_mural_entries` ADD CONSTRAINT `public_mural_entries_pix_donation_id_fkey` FOREIGN KEY (`pix_donation_id`) REFERENCES `pix_donations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `uploaded_files` ADD CONSTRAINT `uploaded_files_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `animals` ADD COLUMN `internal_notes` TEXT NULL;

-- CreateTable
CREATE TABLE `animal_adoption_inquiries` (
    `id` VARCHAR(36) NOT NULL,
    `animal_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `message` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `animal_adoption_inquiries_animal_id_idx`(`animal_id`),
    INDEX `animal_adoption_inquiries_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `animal_adoption_inquiries` ADD CONSTRAINT `animal_adoption_inquiries_animal_id_fkey` FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Phase 21: MFA fields for admin users
ALTER TABLE `users`
  ADD COLUMN `totp_secret_enc` TEXT NULL,
  ADD COLUMN `totp_enabled_at` DATETIME(3) NULL,
  ADD COLUMN `totp_backup_codes` JSON NULL;

SET FOREIGN_KEY_CHECKS = 1;

