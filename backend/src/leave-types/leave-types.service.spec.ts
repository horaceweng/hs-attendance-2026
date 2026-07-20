import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LeaveTypesService } from './leave-types.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  leaveType: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('LeaveTypesService', () => {
  let service: LeaveTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveTypesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<LeaveTypesService>(LeaveTypesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns all leave types from prisma', () => {
      const expected = [{ id: 1, name: 'Sick Leave' }];
      mockPrismaService.leaveType.findMany.mockReturnValue(expected);

      const result = service.findAll();

      expect(mockPrismaService.leaveType.findMany).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('create', () => {
    it('creates a leave type, defaulting description to null', async () => {
      mockPrismaService.leaveType.create.mockResolvedValue({ id: 1, name: 'Sick Leave', description: null });

      const result = await service.create({ name: 'Sick Leave' });

      expect(mockPrismaService.leaveType.create).toHaveBeenCalledWith({
        data: { name: 'Sick Leave', description: null },
      });
      expect(result).toEqual({ id: 1, name: 'Sick Leave', description: null });
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the leave type does not exist', async () => {
      mockPrismaService.leaveType.findUnique.mockResolvedValue(null);

      await expect(service.update(99, { name: 'x' })).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.leaveType.update).not.toHaveBeenCalled();
    });

    it('updates the leave type when it exists', async () => {
      mockPrismaService.leaveType.findUnique.mockResolvedValue({ id: 1, name: 'Sick Leave' });
      mockPrismaService.leaveType.update.mockResolvedValue({ id: 1, name: 'Personal Leave' });

      const result = await service.update(1, { name: 'Personal Leave' });

      expect(mockPrismaService.leaveType.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Personal Leave' },
      });
      expect(result).toEqual({ id: 1, name: 'Personal Leave' });
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the leave type does not exist', async () => {
      mockPrismaService.leaveType.findUnique.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.leaveType.delete).not.toHaveBeenCalled();
    });

    it('deletes the leave type when it exists', async () => {
      mockPrismaService.leaveType.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.leaveType.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(mockPrismaService.leaveType.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ id: 1 });
    });
  });
});
