import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';
import { PrismaService } from '../prisma/prisma.service';
import { AcademicService } from '../academic/academic.service';

const mockPrismaService = {
  season: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  academicYear: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
  student: {
    findMany: jest.fn(),
  },
  holiday: {
    findMany: jest.fn(),
  },
  attendanceRecord: {
    findMany: jest.fn(),
  },
  leaveRequest: {
    findMany: jest.fn(),
  },
  class: {
    findMany: jest.fn(),
  },
  studentClassEnrollment: {
    count: jest.fn(),
  },
};

const mockAcademicService = {
  buildAcademicYearLookup: jest.fn(),
  resolveEnrollment: jest.fn(),
  findAcademicYearByYear: jest.fn(),
};

describe('StatisticsService', () => {
  let service: StatisticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AcademicService, useValue: mockAcademicService },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);

    jest.clearAllMocks();
    mockAcademicService.buildAcademicYearLookup.mockResolvedValue([]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStatisticsReport - 無 academicYear/term 參數時的 fallback 邏輯', () => {
    it('找不到今天所屬的 season 或 academicYear 時，退回「今天前後一個月」的區間（而不是舊的 semester 死引用）', async () => {
      // 今天既沒有對應的 season，也沒有對應的 academicYear
      mockPrismaService.season.findFirst.mockResolvedValue(null);
      mockPrismaService.academicYear.findFirst.mockResolvedValue(null);

      mockPrismaService.student.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Alice',
          enrollments: [{ schoolYear: 2025, classId: 1, class: { id: 1, name: '1A', gradeId: 1, grade: { name: 'Grade 1' } } }],
        },
      ]);
      mockAcademicService.resolveEnrollment.mockResolvedValue({
        schoolYear: 2025,
        classId: 1,
        class: { id: 1, name: '1A', gradeId: 1, grade: { name: 'Grade 1' } },
      });
      mockPrismaService.holiday.findMany.mockResolvedValue([]);
      mockPrismaService.attendanceRecord.findMany.mockResolvedValue([]);
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([]);

      const result = await service.getStatisticsReport({});

      // 兩層 fallback 都應該被嘗試過
      expect(mockPrismaService.season.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.academicYear.findFirst).toHaveBeenCalled();

      // 驗證最終採用的日期區間確實是「今天前後一個月」，而不是拋錯或誤用舊的 semester 邏輯
      const holidayCallArgs = mockPrismaService.holiday.findMany.mock.calls[0][0];
      const { gte, lte } = holidayCallArgs.where.date;
      const now = new Date();
      expect(gte.getTime()).toBeLessThan(now.getTime());
      expect(lte.getTime()).toBeGreaterThan(now.getTime());
      const spanInDays = (lte.getTime() - gte.getTime()) / (1000 * 60 * 60 * 24);
      expect(spanInDays).toBeGreaterThan(55);
      expect(spanInDays).toBeLessThan(65);

      expect(result).toHaveLength(1);
      expect(result[0].studentName).toBe('Alice');
    });

    it('找到今天所屬的 season 時，優先使用 season 的日期區間', async () => {
      const seasonStart = new Date('2026-01-01');
      const seasonEnd = new Date('2026-06-30');
      mockPrismaService.season.findFirst.mockResolvedValue({
        id: 1,
        startDate: seasonStart,
        endDate: seasonEnd,
      });
      mockPrismaService.student.findMany.mockResolvedValue([]);

      const result = await service.getStatisticsReport({});

      expect(mockPrismaService.academicYear.findFirst).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('getAttendanceStatisticsByClass - 分組邏輯', () => {
    it('依 classId 正確分組並計算每班的統計數字', async () => {
      mockPrismaService.class.findMany.mockResolvedValue([
        { id: 1, name: '1A', gradeId: 1, grade: { name: 'Grade 1' } },
        { id: 2, name: '2A', gradeId: 2, grade: { name: 'Grade 2' } },
      ]);
      mockPrismaService.attendanceRecord.findMany.mockResolvedValue([
        { classId: 1, status: 'present' },
        { classId: 1, status: 'present' },
        { classId: 1, status: 'absent' },
        { classId: 2, status: 'late' },
        { classId: 2, status: 'on_leave' },
      ]);

      const result = await service.getAttendanceStatisticsByClass({});

      expect(result).toHaveLength(2);

      const class1Stats = result.find(r => r.classId === 1)!;
      expect(class1Stats.totalDays).toBe(3);
      expect(class1Stats.presentDays).toBe(2);
      expect(class1Stats.absentDays).toBe(1);
      expect(class1Stats.className).toBe('1A');

      const class2Stats = result.find(r => r.classId === 2)!;
      expect(class2Stats.totalDays).toBe(2);
      expect(class2Stats.lateDays).toBe(1);
      expect(class2Stats.onLeaveDays).toBe(1);
      expect(class2Stats.presentDays).toBe(0);
      expect(class2Stats.className).toBe('2A');
    });

    it('沒有任何出缺勤紀錄的班級，統計數字應該全部為 0（不是漏掉該班級）', async () => {
      mockPrismaService.class.findMany.mockResolvedValue([
        { id: 3, name: '3A', gradeId: 3, grade: { name: 'Grade 3' } },
      ]);
      mockPrismaService.attendanceRecord.findMany.mockResolvedValue([]);

      const result = await service.getAttendanceStatisticsByClass({});

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        classId: 3,
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        leaveEarlyDays: 0,
        onLeaveDays: 0,
        attendanceRate: 0,
      });
    });
  });
});
