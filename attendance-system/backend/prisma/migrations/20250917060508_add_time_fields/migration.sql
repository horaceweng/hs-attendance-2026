-- AlterTable
ALTER TABLE `leave_requests` ADD COLUMN `end_time` TIME NULL,
    ADD COLUMN `is_full_day` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `start_time` TIME NULL;
