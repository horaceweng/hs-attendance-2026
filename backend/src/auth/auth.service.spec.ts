import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let existingPasswordHash: string;

  beforeAll(async () => {
    existingPasswordHash = await bcrypt.hash('correct-password', 10);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('returns the user (without passwordHash) when credentials are correct', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 1,
        name: 'alice',
        role: 'teacher',
        passwordHash: existingPasswordHash,
      });

      const result = await service.validateUser('alice', 'correct-password');

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({ where: { name: 'alice' } });
      expect(result).toEqual({ id: 1, name: 'alice', role: 'teacher' });
      expect(result.passwordHash).toBeUndefined();
    });

    it('returns null when the password is wrong', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 1,
        name: 'alice',
        passwordHash: existingPasswordHash,
      });

      const result = await service.validateUser('alice', 'wrong-password');

      expect(result).toBeNull();
    });

    it('returns null when the user does not exist', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.validateUser('nobody', 'whatever');

      expect(result).toBeNull();
    });

    it('returns null when the user has no passwordHash set yet', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 1, name: 'alice', passwordHash: null });

      const result = await service.validateUser('alice', 'anything');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('signs a JWT payload with username, sub, and role', async () => {
      mockJwtService.sign.mockReturnValue('signed-jwt');
      const user = { id: 1, name: 'alice', role: 'teacher' };

      const result = await service.login(user);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        username: 'alice',
        sub: 1,
        role: 'teacher',
      });
      expect(result).toEqual({ access_token: 'signed-jwt' });
    });
  });

  describe('changePassword', () => {
    it('throws UnauthorizedException when the user has no passwordHash set', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 1, passwordHash: null });

      await expect(service.changePassword(1, 'old', 'new-password')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the old password does not match', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 1, passwordHash: existingPasswordHash });

      await expect(service.changePassword(1, 'wrong-old-password', 'new-password')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('hashes and persists the new password when the old one is correct', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 1, passwordHash: existingPasswordHash });
      mockPrismaService.user.update.mockResolvedValue({ id: 1 });

      await service.changePassword(1, 'correct-password', 'brand-new-password');

      expect(mockPrismaService.user.update).toHaveBeenCalledTimes(1);
      const updateArgs = mockPrismaService.user.update.mock.calls[0][0];
      expect(updateArgs.where).toEqual({ id: 1 });
      // 新密碼應該已被雜湊，不應該直接存明碼
      expect(updateArgs.data.passwordHash).not.toBe('brand-new-password');
      await expect(bcrypt.compare('brand-new-password', updateArgs.data.passwordHash)).resolves.toBe(true);
    });
  });

  describe('getUserById', () => {
    it('throws when id is invalid', async () => {
      await expect(service.getUserById(NaN)).rejects.toThrow();
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('throws when the user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserById(999)).rejects.toThrow('User with ID 999 not found');
    });

    it('returns the user without the passwordHash field', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 1,
        name: 'alice',
        role: 'teacher',
        passwordHash: 'hashed',
      });

      const result = await service.getUserById(1);

      expect(result).toEqual({ id: 1, name: 'alice', role: 'teacher' });
      expect((result as any).passwordHash).toBeUndefined();
    });
  });
});
