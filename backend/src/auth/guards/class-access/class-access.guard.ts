// in src/auth/guards/class-access/class-access.guard.ts --- DEBUGGING VERSION

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ClassAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const classId = parseInt(request.params.classId, 10);

    // --- 加入偵錯日誌 ---
    console.log('--- ClassAccessGuard 正在檢查權限 ---');
    console.log('當前使用者 (來自 Token):', user);
    console.log('請求的班級 ID (classId):', classId);
    // --------------------

    if (!user || !classId) {
      console.log('檢查結果：缺少 user 或 classId，拒絕存取。');
      return false;
    }

    if (user.role === 'GA_specialist') {
      console.log('檢查結果：角色為 GA_specialist，直接放行。');
      return true;
    }

    if (user.role === 'teacher') {
      console.log(`準備查詢資料庫：teacherId=<span class="math-inline">\{user\.userId\}, classId\=</span>{classId}`);
      const assignment = await this.prisma.teacherClassAssignment.findFirst({
        where: {
          teacherId: user.userId,
          classId: classId,
          isActive: true,
        },
      });

      // --- 加入偵錯日誌 ---
      console.log('查詢到的指派紀錄 (assignment):', assignment);
      // --------------------

      if (assignment) {
        console.log('檢查結果：找到指派紀錄，授權通過。');
        return true;
      }
    }

    console.log('檢查結果：所有條件均不滿足，拋出 ForbiddenException。');
    throw new ForbiddenException('您沒有權限存取這個班級的資料');
  }
}