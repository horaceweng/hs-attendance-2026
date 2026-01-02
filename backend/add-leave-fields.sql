-- 添加 startTime 和 isFullDay 欄位到 leave_requests 表格
ALTER TABLE `leave_requests`
ADD COLUMN `start_time` TIME NULL,
ADD COLUMN `is_full_day` BOOLEAN NOT NULL DEFAULT TRUE;