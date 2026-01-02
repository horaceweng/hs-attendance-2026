// in src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { LeavesModule } from './leaves/leaves.module';
import { StudentsModule } from './students/students.module';
import { ClassesModule } from './classes/classes.module';
import { LeaveTypesModule } from './leave-types/leave-types.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ReportsModule } from './reports/reports.module';
import { StatisticsModule } from './statistics/statistics.module';
import { AcademicModule } from './academic/academic.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 讓 ConfigModule 在全域可用
    }),
    AuthModule,
    PrismaModule,
    LeavesModule,
    StudentsModule,
    ClassesModule,
    LeaveTypesModule,
    AttendanceModule,
    ReportsModule,
    StatisticsModule,
    AcademicModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
