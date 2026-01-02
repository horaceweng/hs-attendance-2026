// in src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // 驗證使用者帳號密碼
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: { name: username },
    });

    // 警告：這裡是明文比對，僅供開發測試！未來會換成 bcrypt 雜湊比對
    if (user && pass === 'password') { // 假設所有人的密碼都是 'password'
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ...result } = user; // 在真實應用中可以過濾掉密碼欄位
      return result;
    }
    return null;
  }

  // 登入並簽發 JWT
  async login(user: any) {
    const payload = { username: user.name, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
  
  // 根據 ID 獲取用戶資料
  async getUserById(id: number) {
    try {
      console.log(`Looking up user with ID: ${id}`);
      
      if (!id || isNaN(id)) {
        throw new Error(`Invalid user ID: ${id}`);
      }
      
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      
      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }
      
      console.log(`Successfully found user: ${user.name}, role: ${user.role}`);
      
      // 不回傳敏感資訊
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ...result } = user;
      return result;
    } catch (error) {
      console.error(`Error in getUserById(${id}):`, error.message);
      throw error; // 繼續拋出錯誤，讓調用者處理
    }
  }
}