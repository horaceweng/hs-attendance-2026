// 請確認 backend/src/attendance/attendance.module.ts 的內容如下：

import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule], // 必須導入 PrismaModule
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}