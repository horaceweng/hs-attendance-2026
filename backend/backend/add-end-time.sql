-- 添加 end_time 欄位到 leave_requests 表格
ALTER TABLE `leave_requests`
ADD COLUMN `end_time` TIME NULL;