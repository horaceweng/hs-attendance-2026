import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { AcademicService } from '../academic/academic.service';

const mockPrismaService = {
  student: {
    findMany: jest.fn(),
  },
  attendanceRecord: {
    findMany: jest.fn(),
  },
  leaveRequest: {
    findMany: jest.fn(),
  },
};

const mockAcademicService = {
  buildAcademicYearLookup: jest.fn(),
  resolveEnrollment: jest.fn(),
};

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AcademicService, useValue: mockAcademicService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);

    jest.clearAllMocks();
    mockAcademicService.buildAcademicYearLookup.mockResolvedValue([]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAttendanceReport - 請假優先於出勤（最高優先業務規則）', () => {
    const student1 = { id: 1, name: 'Alice', enrollments: [] };
    const student2 = { id: 2, name: 'Bob', enrollments: [] };
    const enrollment1 = { class: { gradeId: 10, name: '1A', grade: { name: 'Grade 1' } } };
    const enrollment2 = { class: { gradeId: 11, name: '2A', grade: { name: 'Grade 2' } } };

    beforeEach(() => {
      mockPrismaService.student.findMany.mockResolvedValue([student1, student2]);
      mockAcademicService.resolveEnrollment.mockImplementation((student: any) => {
        if (student.id === 1) return Promise.resolve(enrollment1);
        if (student.id === 2) return Promise.resolve(enrollment2);
        return Promise.resolve(null);
      });
    });

    it('同一學生同一天同時有 attendanceRecord 與 approved leaveRequest 時，最終狀態必須是 on_leave', async () => {
      mockPrismaService.attendanceRecord.findMany.mockResolvedValue([
        { id: 100, studentId: 1, attendanceDate: new Date('2026-01-15'), status: 'absent', note: 'sick note', leaveType: null },
      ]);
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([
        {
          id: 200,
          studentId: 1,
          status: 'approved',
          startDate: new Date('2026-01-15'),
          endDate: new Date('2026-01-15'),
          leaveType: { name: 'Sick Leave' },
        },
      ]);

      const result = await service.getAttendanceReport({
        startDate: '2026-01-15',
        endDate: '2026-01-15',
      });

      const aliceRow = result.find(r => r.studentName === 'Alice');
      expect(aliceRow).toBeDefined();
      expect(aliceRow!.status).toBe('on_leave');
      expect(aliceRow!.leaveStatus).toBe('approved');
      expect(aliceRow!.leaveTypeName).toBe('Sick Leave');
    });

    it('pending 狀態的 leaveRequest 一樣要蓋過 attendanceRecord（不只 approved 才算）', async () => {
      mockPrismaService.attendanceRecord.findMany.mockResolvedValue([
        { id: 100, studentId: 1, attendanceDate: new Date('2026-01-15'), status: 'late', note: null, leaveType: null },
      ]);
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([
        {
          id: 201,
          studentId: 1,
          status: 'pending',
          startDate: new Date('2026-01-15'),
          endDate: new Date('2026-01-15'),
          leaveType: { name: 'Personal Leave' },
        },
      ]);

      const result = await service.getAttendanceReport({
        startDate: '2026-01-15',
        endDate: '2026-01-15',
      });

      const aliceRow = result.find(r => r.studentName === 'Alice');
      expect(aliceRow!.status).toBe('on_leave');
      expect(aliceRow!.leaveStatus).toBe('pending');
    });

    it('沒有請假涵蓋當天時，attendanceRecord 的狀態才會被採用', async () => {
      mockPrismaService.attendanceRecord.findMany.mockResolvedValue([
        { id: 100, studentId: 1, attendanceDate: new Date('2026-01-15'), status: 'late', note: null, leaveType: null },
      ]);
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([]);

      const result = await service.getAttendanceReport({
        startDate: '2026-01-15',
        endDate: '2026-01-15',
      });

      const aliceRow = result.find(r => r.studentName === 'Alice');
      expect(aliceRow!.status).toBe('late');
    });

    it('沒有任何紀錄時預設為 present', async () => {
      mockPrismaService.attendanceRecord.findMany.mockResolvedValue([]);
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([]);

      const result = await service.getAttendanceReport({
        startDate: '2026-01-15',
        endDate: '2026-01-15',
      });

      const bobRow = result.find(r => r.studentName === 'Bob');
      expect(bobRow!.status).toBe('present');
    });

    it('依 enrollment 解析出的年級篩選：不符合 grades 篩選的學生會被排除', async () => {
      mockPrismaService.attendanceRecord.findMany.mockResolvedValue([]);
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([]);

      const result = await service.getAttendanceReport({
        startDate: '2026-01-15',
        endDate: '2026-01-15',
        grades: ['10'],
      });

      expect(result).toHaveLength(1);
      expect(result[0].studentName).toBe('Alice');
    });

    it('依 statuses 篩選最終報表列', async () => {
      mockPrismaService.attendanceRecord.findMany.mockResolvedValue([
        { id: 100, studentId: 1, attendanceDate: new Date('2026-01-15'), status: 'late', note: null, leaveType: null },
      ]);
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([]);

      const result = await service.getAttendanceReport({
        startDate: '2026-01-15',
        endDate: '2026-01-15',
        statuses: ['late'],
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('late');
    });

    it('會跳過 resolveEnrollment 回傳 null 的學生（無任何班級註冊紀錄）', async () => {
      mockPrismaService.attendanceRecord.findMany.mockResolvedValue([]);
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([]);
      mockAcademicService.resolveEnrollment.mockImplementation((student: any) => {
        if (student.id === 1) return Promise.resolve(null); // Alice 完全沒有註冊紀錄
        if (student.id === 2) return Promise.resolve(enrollment2);
        return Promise.resolve(null);
      });

      const result = await service.getAttendanceReport({
        startDate: '2026-01-15',
        endDate: '2026-01-15',
      });

      expect(result.find(r => r.studentName === 'Alice')).toBeUndefined();
      expect(result.find(r => r.studentName === 'Bob')).toBeDefined();
    });

    it('依日期解析學年/註冊：對每位學生每一天呼叫 resolveEnrollment 並帶入預先載入的學年快取', async () => {
      const cachedYears = [{ id: 1, year: 2025 }];
      mockAcademicService.buildAcademicYearLookup.mockResolvedValue(cachedYears);
      mockPrismaService.attendanceRecord.findMany.mockResolvedValue([]);
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([]);

      await service.getAttendanceReport({ startDate: '2026-01-15', endDate: '2026-01-15' });

      expect(mockAcademicService.buildAcademicYearLookup).toHaveBeenCalledTimes(1);
      expect(mockAcademicService.resolveEnrollment).toHaveBeenCalledWith(
        student1,
        expect.any(Date),
        cachedYears,
      );
    });

    it('沒有指定 startDate/endDate 時，預設用今天，不會拋錯', async () => {
      mockPrismaService.attendanceRecord.findMany.mockResolvedValue([]);
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([]);

      await expect(service.getAttendanceReport({})).resolves.not.toThrow();
    });

    it('當範圍內沒有學生時，回傳空陣列', async () => {
      mockPrismaService.student.findMany.mockResolvedValue([]);

      const result = await service.getAttendanceReport({ startDate: '2026-01-15', endDate: '2026-01-15' });

      expect(result).toEqual([]);
    });
  });

  describe('getPendingLeavesReport', () => {
    it('只查詢 pending 狀態的請假', async () => {
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([]);

      await service.getPendingLeavesReport({});

      expect(mockPrismaService.leaveRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'pending' }) }),
      );
    });

    it('ageFilter=within_3_days 時加上 createdAt gte 條件', async () => {
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([]);

      await service.getPendingLeavesReport({ ageFilter: 'within_3_days' });

      const callArgs = mockPrismaService.leaveRequest.findMany.mock.calls[0][0];
      expect(callArgs.where.createdAt).toHaveProperty('gte');
    });

    it('ageFilter=over_3_days 時加上 createdAt lt 條件', async () => {
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([]);

      await service.getPendingLeavesReport({ ageFilter: 'over_3_days' });

      const callArgs = mockPrismaService.leaveRequest.findMany.mock.calls[0][0];
      expect(callArgs.where.createdAt).toHaveProperty('lt');
    });

    it('grades 篩選會轉換成 student.enrollments.some.class.gradeId 條件', async () => {
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([]);

      await service.getPendingLeavesReport({ grades: ['10', '11'] });

      const callArgs = mockPrismaService.leaveRequest.findMany.mock.calls[0][0];
      expect(callArgs.where.student).toEqual({
        enrollments: { some: { class: { gradeId: { in: [10, 11] } } } },
      });
    });
  });

  describe('getUnresolvedAbsencesReport', () => {
    it('若缺席日期已有涵蓋當天的請假，則不視為未解決的缺席', async () => {
      mockPrismaService.attendanceRecord.findMany.mockResolvedValue([
        { id: 1, studentId: 1, status: 'absent', attendanceDate: new Date('2026-01-15') },
      ]);
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([
        { studentId: 1, startDate: new Date('2026-01-14'), endDate: new Date('2026-01-16') },
      ]);

      const result = await service.getUnresolvedAbsencesReport({});

      expect(result).toEqual([]);
    });

    it('沒有對應請假時，缺席紀錄視為未解決', async () => {
      mockPrismaService.attendanceRecord.findMany.mockResolvedValue([
        { id: 1, studentId: 1, status: 'absent', attendanceDate: new Date('2026-01-15') },
      ]);
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([]);

      const result = await service.getUnresolvedAbsencesReport({});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('沒有缺席紀錄時直接回傳空陣列，不再查詢 leaveRequest', async () => {
      mockPrismaService.attendanceRecord.findMany.mockResolvedValue([]);

      const result = await service.getUnresolvedAbsencesReport({});

      expect(result).toEqual([]);
      expect(mockPrismaService.leaveRequest.findMany).not.toHaveBeenCalled();
    });
  });
});
