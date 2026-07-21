import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

// 已過濾掉 passwordHash 的使用者物件，validateUser 的回傳型別、
// LocalStrategy.validate 的回傳型別皆共用此型別
export type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // 驗證使用者帳號密碼
  async validateUser(username: string, pass: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findFirst({
      where: { name: username },
    });

    // 尚未設定密碼（passwordHash 為 null）的帳號一律拒絕登入
    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(pass, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user; // 過濾掉密碼雜湊欄位
    return result;
  }

  // 登入並簽發 JWT
  async login(user: Pick<User, 'id' | 'name' | 'role'>) {
    const payload = { username: user.name, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // 修改密碼：需先驗證舊密碼正確才能寫入新密碼雜湊
  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('尚未設定密碼，無法修改');
    }

    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      user.passwordHash,
    );
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('舊密碼錯誤');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }

  // 根據 ID 獲取用戶資料
  async getUserById(id: number) {
    try {
      if (!id || isNaN(id)) {
        throw new Error(`Invalid user ID: ${id}`);
      }

      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }

      // 不回傳敏感資訊
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    } catch (error) {
      console.error(`Error in getUserById(${id}):`, error.message);
      throw error; // 繼續拋出錯誤，讓調用者處理
    }
  }
}
