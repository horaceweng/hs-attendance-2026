/*
  Warnings:

  - A unique constraint covering the columns `[student_id,attendance_date]` on the table `attendance_records` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `attendance_records_student_id_attendance_date_key` ON `attendance_records`(`student_id`, `attendance_date`);
