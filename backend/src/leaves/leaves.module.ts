// in src/leaves/leaves.module.ts
import { Module } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { LeavesController } from './leaves.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule], // <-- 加入這行
  controllers: [LeavesController],
  providers: [LeavesService],
})
export class LeavesModule {}