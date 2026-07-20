// in src/statistics/statistics.module.ts
import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AcademicModule } from 'src/academic/academic.module';

@Module({
  imports: [PrismaModule, AcademicModule],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}