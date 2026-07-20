import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  student: {
    findMany: jest.fn(),
  },
  leaveRequest: {
    findMany: jest.fn(),
  },
  attendanceRecord: {
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('AttendanceService', () => {
  let service: AttendanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAttendanceForClass', () => {
    it('returns an empty list when the class has no students', async () => {
      mockPrismaService.student.findMany.mockResolvedValue([]);

      const result = await service.getAttendanceForClass(1, new Date('2026-01-15'));

      expect(result).toEqual([]);
      // 沒有學生時不應該再去查請假/出勤紀錄
      expect(mockPrismaService.leaveRequest.findMany).not.toHaveBeenCalled();
    });

    it('請假優先於出勤：同一天同時有 on_leave 條件與 attendanceRecord 時，狀態必須是 on_leave', async () => {
      const date = new Date('2026-01-15');
      mockPrismaService.student.findMany.mockResolvedValue([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Carol' },
      ]);
      // Alice (id 1) 同時有請假（pending）跟出勤紀錄（absent）——請假必須勝出
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([
        { studentId: 1, status: 'pending' },
      ]);
      mockPrismaService.attendanceRecord.findMany.mockResolvedValue([
        { studentId: 1, status: 'absent' },
        { studentId: 2, status: 'late' },
      ]);

      const result = await service.getAttendanceForClass(1, date);

      expect(result).toEqual([
        { studentId: 1, studentName: 'Alice', status: 'on_leave' },
        { studentId: 2, studentName: 'Bob', status: 'late' },
        { studentId: 3, studentName: 'Carol', status: 'present' },
      ]);
    });
  });

  describe('recordClassAttendance', () => {
    it('排除當天請假中的學生，只對其餘學生做 upsert', async () => {
      const classId = 1;
      const creatorId = 99;
      const dto = {
        attendanceDate: '2026-01-15',
        records: [
          { studentId: 1, status: 'present', note: undefined },
          { studentId: 2, status: 'absent', note: 'sick note' },
        ],
      } as any;

      // 學生 1 當天請假中，應該被排除在 upsert 之外
      mockPrismaService.leaveRequest.findMany.mockResolvedValue([{ studentId: 1 }]);
      mockPrismaService.attendanceRecord.upsert.mockImplementation((args: any) => args);
      mockPrismaService.$transaction.mockImplementation((ops: any[]) => Promise.resolve(ops));

      await service.recordClassAttendance(classId, creatorId, dto);

      expect(mockPrismaService.attendanceRecord.upsert).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.attendanceRecord.upsert).toHaveBeenCalledWith({
        where: {
          studentId_attendanceDate: { studentId: 2, attendanceDate: new Date(dto.attendanceDate) },
        },
        update: { status: 'absent', note: 'sick note' },
        create: {
          studentId: 2,
          classId,
          attendanceDate: new Date(dto.attendanceDate),
          status: 'absent',
          note: 'sick note',
          createdById: creatorId,
        },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});
