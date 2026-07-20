import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ClassAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const classId = parseInt(request.params.classId, 10);

    if (!user || !classId) {
      return false;
    }

    if (user.role === 'GA_specialist') {
      return true;
    }

    if (user.role === 'teacher') {
      const assignment = await this.prisma.teacherClassAssignment.findFirst({
        where: {
          teacherId: user.userId,
          classId: classId,
          isActive: true,
        },
      });

      if (assignment) {
        return true;
      }
    }

    throw new ForbiddenException('您沒有權限存取這個班級的資料');
  }
}
