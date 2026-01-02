// in src/classes/classes.module.ts
import { Module } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule], // <-- 加入這行
  controllers: [ClassesController],
  providers: [ClassesService],
})
export class ClassesModule {}