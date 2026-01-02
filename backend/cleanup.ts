// in cleanup.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ===================================================================
  // === 請在這裡填入您要刪除的學生姓名和確切日期 (YYYY-MM-DD) ===
  const studentNameToClean = '張廖芯湄'; // 舉例，請換成實際有衝突的學生姓名
  const dateToClean = '2025-06-22';   // 舉例，請換成實際有衝突的日期
  // ===================================================================

  console.log(`準備清理學生: ${studentNameToClean}, 日期: ${dateToClean} 的衝突紀錄...`);

  // 1. 根據姓名找到學生 ID
  const student = await prisma.student.findFirst({
    where: { name: studentNameToClean },
  });

  if (!student) {
    console.error(`錯誤：在資料庫中找不到名為 "${studentNameToClean}" 的學生。`);
    return;
  }

  // 2. 刪除該名學生在指定日期的 'absent' (缺席) 紀錄
  const deleteResult = await prisma.attendanceRecord.deleteMany({
    where: {
      studentId: student.id,
      attendanceDate: new Date(dateToClean),
      status: 'absent', // 我們只刪除這筆衝突的 "缺席" 紀錄
    },
  });

  if (deleteResult.count > 0) {
    console.log(`✅ 成功! 已經從資料庫中刪除了 ${deleteResult.count} 筆衝突的紀錄。`);
  } else {
    console.warn(`⚠️ 注意：在資料庫中找不到符合條件 (學生: ${studentNameToClean}, 日期: ${dateToClean}, 狀態: absent) 的紀錄可供刪除。`);
  }
}

main()
  .catch((e) => {
    console.error('執行腳本時發生錯誤:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('腳本執行完畢，已斷開資料庫連接。');
  });