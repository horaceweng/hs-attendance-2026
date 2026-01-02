// prisma-extension.ts
import { PrismaClient } from '@prisma/client';

export function extendedPrismaClient() {
  const prisma = new PrismaClient();
  
  return prisma.$extends({
    model: {
      leaveRequest: {
        async create({ data, ...args }: any) {
          // 提取特殊欄位
          const { startTime, endTime, isFullDay, ...standardData } = data;
          
          // 直接使用原始 SQL 插入所有欄位
          const result = await prisma.$queryRaw`
            INSERT INTO leave_requests (
              student_id, leave_type_id, start_date, end_date, 
              start_time, end_time, is_full_day, reason,
              created_by_id, status, created_at, updated_at
            ) VALUES (
              ${standardData.studentId}, 
              ${standardData.leaveTypeId}, 
              ${standardData.startDate}, 
              ${standardData.endDate}, 
              ${startTime}, 
              ${endTime}, 
              ${isFullDay === undefined ? true : isFullDay}, 
              ${standardData.reason || null}, 
              ${standardData.createdById},
              'pending',
              NOW(),
              NOW()
            )
          `;
          
          // 查詢最後插入的記錄
          const lastInsertId = await prisma.$queryRaw`SELECT LAST_INSERT_ID() as id`;
          const insertedId = (lastInsertId as any)[0].id;
          
          return prisma.leaveRequest.findUnique({
            where: { id: insertedId },
            ...args
          });
        }
      }
    }
  });
}