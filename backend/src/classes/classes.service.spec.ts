import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  academicYear: {
    findFirst: jest.fn(),
  },
  class: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  teacherClassAssignment: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  studentClassEnrollment: {
    count: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
  },
};

describe('ClassesService', () => {
  let service: ClassesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns [] when there is no user/role', async () => {
      const result = await service.findAll(undefined as any);
      expect(result).toEqual([]);
    });

    it('filters classes by the active academic year for GA_specialist', async () => {
      mockPrismaService.academicYear.findFirst.mockResolvedValue({ id: 1, year: 2026 });
      mockPrismaService.class.findMany.mockResolvedValue([{ id: 1, schoolYear: 2026 }]);

      const result = await service.findAll({ userId: 1, role: 'GA_specialist' });

      expect(mockPrismaService.class.findMany).toHaveBeenCalledWith({
        where: { schoolYear: 2026 },
        orderBy: { id: 'asc' },
      });
      expect(result).toEqual([{ id: 1, schoolYear: 2026 }]);
    });

    it('filters classes by active academic year and teacher assignment for teacher role', async () => {
      mockPrismaService.academicYear.findFirst.mockResolvedValue({ id: 1, year: 2026 });
      mockPrismaService.class.findMany.mockResolvedValue([{ id: 2, schoolYear: 2026 }]);

      const result = await service.findAll({ userId: 7, role: 'teacher' });

      expect(mockPrismaService.class.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { schoolYear: 2026 },
            { teacherAssignments: { some: { teacherId: 7, isActive: true } } },
          ],
        },
        orderBy: { id: 'asc' },
      });
      expect(result).toEqual([{ id: 2, schoolYear: 2026 }]);
    });

    it('falls back to unfiltered classes when there is no active academic year (GA_specialist)', async () => {
      mockPrismaService.academicYear.findFirst.mockResolvedValue(null);
      mockPrismaService.class.findMany.mockResolvedValue([{ id: 1 }]);

      const result = await service.findAll({ userId: 1, role: 'GA_specialist' });

      expect(mockPrismaService.class.findMany).toHaveBeenCalledWith({ orderBy: { id: 'asc' } });
      expect(result).toEqual([{ id: 1 }]);
    });

    it('returns [] for an unknown role', async () => {
      mockPrismaService.academicYear.findFirst.mockResolvedValue({ id: 1, year: 2026 });

      const result = await service.findAll({ userId: 1, role: 'unknown' as any });

      expect(result).toEqual([]);
    });
  });

  describe('checkIsAdmin', () => {
    it('throws ForbiddenException for non GA_specialist users', async () => {
      await expect(service.checkIsAdmin({ userId: 1, role: 'teacher' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('resolves without throwing for GA_specialist users', async () => {
      await expect(
        service.checkIsAdmin({ userId: 1, role: 'GA_specialist' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('create', () => {
    it('rejects when the caller is not an admin', async () => {
      await expect(
        service.create({ name: '1A' }, { userId: 1, role: 'teacher' }),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.class.create).not.toHaveBeenCalled();
    });

    it('creates a class with the default gradeId when the caller is an admin', async () => {
      mockPrismaService.class.create.mockResolvedValue({ id: 1, name: '1A' });

      const result = await service.create({ name: '1A' }, { userId: 1, role: 'GA_specialist' });

      expect(mockPrismaService.class.create).toHaveBeenCalledWith({
        data: { name: '1A', gradeId: 1, schoolYear: new Date().getFullYear() },
      });
      expect(result).toEqual({ id: 1, name: '1A' });
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the class does not exist', async () => {
      mockPrismaService.class.findUnique.mockResolvedValue(null);

      await expect(
        service.update(99, { name: 'x' }, { userId: 1, role: 'GA_specialist' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.class.update).not.toHaveBeenCalled();
    });

    it('updates the class when it exists', async () => {
      mockPrismaService.class.findUnique.mockResolvedValue({ id: 1, name: '1A' });
      mockPrismaService.class.update.mockResolvedValue({ id: 1, name: '1B' });

      const result = await service.update(1, { name: '1B' }, { userId: 1, role: 'GA_specialist' });

      expect(mockPrismaService.class.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: '1B' },
      });
      expect(result).toEqual({ id: 1, name: '1B' });
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the class does not exist', async () => {
      mockPrismaService.class.findUnique.mockResolvedValue(null);

      await expect(service.remove(99, { userId: 1, role: 'GA_specialist' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when the class still has enrolled students', async () => {
      mockPrismaService.class.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.studentClassEnrollment.count.mockResolvedValue(3);

      await expect(service.remove(1, { userId: 1, role: 'GA_specialist' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrismaService.class.delete).not.toHaveBeenCalled();
    });

    it('deletes the class when it has no students', async () => {
      mockPrismaService.class.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.studentClassEnrollment.count.mockResolvedValue(0);
      mockPrismaService.class.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1, { userId: 1, role: 'GA_specialist' });

      expect(mockPrismaService.class.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('assignTeacher', () => {
    const data = { classId: 1, teacherId: 2, schoolYear: '2026' };

    it('throws NotFoundException when the class does not exist', async () => {
      mockPrismaService.class.findUnique.mockResolvedValue(null);

      await expect(service.assignTeacher(data, { userId: 1, role: 'GA_specialist' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when the teacher does not exist', async () => {
      mockPrismaService.class.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.assignTeacher(data, { userId: 1, role: 'GA_specialist' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('creates the teacher-class assignment when both exist', async () => {
      mockPrismaService.class.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 2, role: 'teacher' });
      mockPrismaService.teacherClassAssignment.create.mockResolvedValue({ id: 10, ...data });

      const result = await service.assignTeacher(data, { userId: 1, role: 'GA_specialist' });

      expect(mockPrismaService.teacherClassAssignment.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 10, ...data });
    });
  });
});
