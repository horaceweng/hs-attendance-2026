-- schema.prisma 的 StudentClassEnrollment.createdAt 一直存在，但初始 migration
-- (20250621013415_init) 未建立對應欄位；本機開發資料庫在某次未經記錄的手動變更
-- 中已補上此欄位，導致這個缺口直到部署到全新的 TiDB 資料庫才被發現。
ALTER TABLE `student_class_enrollments`
  ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
