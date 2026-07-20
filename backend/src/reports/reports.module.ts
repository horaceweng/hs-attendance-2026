import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AcademicModule } from 'src/academic/academic.module';

@Module({
  imports: [PrismaModule, AcademicModule],
  controllers: [ReportsController],
  providers: [ReportsService]
})
export class ReportsModule {}
