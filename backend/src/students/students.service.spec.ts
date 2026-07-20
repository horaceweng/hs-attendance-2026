import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { PrismaService } from '../prisma/prisma.service';
import { Gender, StudentStatus } from '@prisma/client';

const mockPrismaService = {
  student: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  attendanceRecord: {
    deleteMany: jest.fn(),
  },
  leaveRequest: {
    deleteMany: jest.fn(),
  },
  studentClassEnrollment: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe('StudentsService', () => {
  let service: StudentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByClass', () => {
    it('queries students enrolled in the given class', () => {
      const expected = [{ id: 1, name: 'Alice' }];
      mockPrismaService.student.findMany.mockReturnValue(expected);

      const result = service.findAllByClass(5);

      expect(mockPrismaService.student.findMany).toHaveBeenCalledWith({
        where: { enrollments: { some: { classId: 5 } } },
      });
      expect(result).toEqual(expected);
    });
  });

  describe('findAll', () => {
    it('filters by status when a specific status is provided', () => {
      mockPrismaService.student.findMany.mockReturnValue([]);

      service.findAll('active', false);

      expect(mockPrismaService.student.findMany).toHaveBeenCalledWith({
        where: { status: 'active' },
        include: undefined,
        orderBy: [{ name: 'asc' }],
      });
    });

    it('does not filter by status when status is "all" or omitted', () => {
      mockPrismaService.student.findMany.mockReturnValue([]);

      service.findAll('all', false);

      expect(mockPrismaService.student.findMany).toHaveBeenCalledWith({
        where: {},
        include: undefined,
        orderBy: [{ name: 'asc' }],
      });
    });

    it('includes enrollments/class/grade when includeEnrollments is true', () => {
      mockPrismaService.student.findMany.mockReturnValue([]);

      service.findAll(undefined, true);

      const callArgs = mockPrismaService.student.findMany.mock.calls[0][0];
      expect(callArgs.include).toEqual({
        enrollments: {
          include: { class: { include: { grade: true } } },
          orderBy: { id: 'desc' },
        },
      });
    });
  });

  describe('create', () => {
    it('converts date strings and nulls out optional fields', () => {
      mockPrismaService.student.create.mockReturnValue({ id: 1 });

      service.create({
        studentId: 'S001',
        name: 'Alice',
        birthday: '2015-01-01',
        gender: Gender.female,
        status: StudentStatus.active,
        enrollmentDate: '2026-09-01',
      });

      expect(mockPrismaService.student.create).toHaveBeenCalledWith({
        data: {
          studentId: 'S001',
          name: 'Alice',
          birthday: new Date('2015-01-01'),
          gender: Gender.female,
          status: StudentStatus.active,
          enrollmentDate: new Date('2026-09-01'),
          departureDate: null,
          departureReason: null,
        },
      });
    });
  });

  describe('remove', () => {
    it('cascades deletes across attendance, leaves, and enrollments before deleting the student', async () => {
      mockPrismaService.attendanceRecord.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.leaveRequest.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.studentClassEnrollment.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.student.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(mockPrismaService.attendanceRecord.deleteMany).toHaveBeenCalledWith({ where: { studentId: 1 } });
      expect(mockPrismaService.leaveRequest.deleteMany).toHaveBeenCalledWith({ where: { studentId: 1 } });
      expect(mockPrismaService.studentClassEnrollment.deleteMany).toHaveBeenCalledWith({ where: { studentId: 1 } });
      expect(mockPrismaService.student.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('getStudentEnrollments', () => {
    it('queries enrollments for the given student, newest first', () => {
      const expected = [{ id: 2 }, { id: 1 }];
      mockPrismaService.studentClassEnrollment.findMany.mockReturnValue(expected);

      const result = service.getStudentEnrollments(7);

      expect(mockPrismaService.studentClassEnrollment.findMany).toHaveBeenCalledWith({
        where: { studentId: 7 },
        include: { class: { include: { grade: true } } },
        orderBy: { id: 'desc' },
      });
      expect(result).toEqual(expected);
    });
  });

  describe('createStudentEnrollment', () => {
    it('creates an enrollment record from the dto', () => {
      mockPrismaService.studentClassEnrollment.create.mockReturnValue({ id: 1 });

      service.createStudentEnrollment({ studentId: 1, classId: 2, schoolYear: 2026 });

      expect(mockPrismaService.studentClassEnrollment.create).toHaveBeenCalledWith({
        data: { studentId: 1, classId: 2, schoolYear: 2026 },
      });
    });
  });
});
