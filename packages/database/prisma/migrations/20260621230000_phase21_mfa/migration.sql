-- Phase 21: MFA fields for admin users
ALTER TABLE `users`
  ADD COLUMN `totp_secret_enc` TEXT NULL,
  ADD COLUMN `totp_enabled_at` DATETIME(3) NULL,
  ADD COLUMN `totp_backup_codes` JSON NULL;
