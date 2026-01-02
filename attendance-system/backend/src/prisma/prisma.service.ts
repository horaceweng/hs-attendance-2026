import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // keep Prisma logs for warnings and errors
    super({
      log: ['error', 'warn'],
    });
  }
  
  async onModuleInit() {
    // In some cloud build/runtime environments the database may not be reachable
    // at process start (or during build). Allow skipping the initial connect by
    // setting `SKIP_DB_CONNECT=true` in the environment. This prevents Prisma
    // from throwing during Nest app bootstrap when DB is intentionally unavailable.
    const skipConnect = process.env.SKIP_DB_CONNECT === 'true';
    if (skipConnect) {
      this.logger.warn('SKIP_DB_CONNECT=true, skipping initial Prisma $connect()');
      return;
    }

    try {
      await this.$connect();
      this.logger.log('Prisma connected');
    } catch (err) {
      // Log error details but do not crash the process here. Relying services
      // should handle Prisma connection errors where appropriate. This avoids
      // hard failures during build or when DB is temporarily unreachable.
      this.logger.error('Prisma $connect() failed:', (err as Error).message);
      this.logger.debug((err as Error).stack || 'no stack');
      // Re-throw only if an explicit env var asks for strict connect behavior
      if (process.env.PRISMA_STRICT_CONNECT === 'true') {
        throw err;
      }
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Prisma disconnected');
    } catch (err) {
      this.logger.warn('Prisma $disconnect() failed: ' + (err as Error).message);
    }
  }
}
