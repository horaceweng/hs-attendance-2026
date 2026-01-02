// in src/auth/auth.controller.ts
import { Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /auth/login
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req) {
    // 執行到這裡，代表 LocalStrategy 的 validate 已成功，
    // req.user 中已包含驗證成功的使用者物件
    return this.authService.login(req.user);
  }

  // GET /auth/profile
  // 這個 API 用來測試 JWT 是否有效
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    // 執行到這裡，代表 JWT 驗證成功
    // req.user 中包含 JwtStrategy validate 回傳的 payload
    return req.user;
  }
  
  // GET /auth/me
  // 這個 API 用來獲取當前用戶的完整信息
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getCurrentUser(@Request() req) {
    try {
      console.log('Auth /me request received, user payload:', req.user);
      
      if (!req.user || !req.user.userId) {
        console.error('Auth /me error: Missing user ID in request');
        return { 
          error: 'Missing user ID in request',
          payload: req.user 
        };
      }
      
      const user = await this.authService.getUserById(req.user.userId);
      console.log(`Auth /me success: Found user with ID ${req.user.userId}`);
      
      return {
        ...user,
        role: req.user.role, // 確保角色信息也包含在內
      };
    } catch (error) {
      console.error('Auth /me error:', error.message, error.stack);
      
      // 返回更有用的錯誤信息，而不是通用的 500 錯誤
      return { 
        error: error.message,
        userId: req.user?.userId,
        role: req.user?.role 
      };
    }
  }
}