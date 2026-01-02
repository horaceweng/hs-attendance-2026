// in src/students/students.module.ts
import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule], // <-- 加入這行
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}