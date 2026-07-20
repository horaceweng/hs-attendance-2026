import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';

const mockAuthService = {
  login: jest.fn(),
  getUserById: jest.fn(),
  changePassword: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('delegates to authService.login with req.user (populated by LocalStrategy)', async () => {
      const user = { id: 1, name: 'alice', role: 'teacher' };
      const req = { user };
      const expectedResult = { access_token: 'signed-jwt' };
      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(req);

      expect(service.login).toHaveBeenCalledWith(user);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getProfile', () => {
    it('returns req.user as-is (already validated by JwtStrategy)', () => {
      const payload = { userId: 1, role: 'teacher' };
      const req = { user: payload };

      const result = controller.getProfile(req);

      expect(result).toEqual(payload);
    });
  });

  describe('getCurrentUser', () => {
    it('fetches the user by id and merges in the role from the JWT payload', async () => {
      const req = { user: { userId: 1, role: 'teacher' } };
      mockAuthService.getUserById.mockResolvedValue({ id: 1, name: 'alice' });

      const result = await controller.getCurrentUser(req);

      expect(service.getUserById).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1, name: 'alice', role: 'teacher' });
    });

    it('returns an error payload instead of throwing when userId is missing', async () => {
      const req = { user: {} };

      const result = await controller.getCurrentUser(req);

      expect(service.getUserById).not.toHaveBeenCalled();
      expect(result).toEqual({
        error: 'Missing user ID in request',
        payload: req.user,
      });
    });

    it('catches service errors and returns an error payload', async () => {
      const req = { user: { userId: 1, role: 'teacher' } };
      mockAuthService.getUserById.mockRejectedValue(new Error('boom'));

      const result = await controller.getCurrentUser(req);

      expect(result).toEqual({
        error: 'boom',
        userId: 1,
        role: 'teacher',
      });
    });
  });

  describe('changePassword', () => {
    it('delegates to authService.changePassword with userId and both passwords', async () => {
      const req = { user: { userId: 1 } };
      const dto: ChangePasswordDto = { oldPassword: 'old-pass', newPassword: 'new-password' };
      mockAuthService.changePassword.mockResolvedValue(undefined);

      const result = await controller.changePassword(req, dto);

      expect(service.changePassword).toHaveBeenCalledWith(1, dto.oldPassword, dto.newPassword);
      expect(result).toEqual({ message: '密碼已更新' });
    });
  });
});
