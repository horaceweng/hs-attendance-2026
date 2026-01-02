import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule], // <-- 加入這行
  controllers: [ReportsController],
  providers: [ReportsService]
})
export class ReportsModule {}
