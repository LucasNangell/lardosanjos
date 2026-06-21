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
