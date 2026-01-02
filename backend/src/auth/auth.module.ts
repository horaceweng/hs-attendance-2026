// in src/auth/auth.module.ts --- PATH FIXED
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
// 【路徑修正】從正確的路徑導入 Guard
import { ClassAccessGuard } from './guards/class-access/class-access.guard';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        // Make token lifetime configurable via JWT_EXPIRES_IN (e.g. '1d', '7d', '12h', or seconds)
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, ClassAccessGuard],
})
export class AuthModule {}