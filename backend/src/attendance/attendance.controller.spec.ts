import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitClassAttendanceDto } from './dto/submit-attendance.dto';

// AttendanceController 上有 @UseGuards(AuthGuard('jwt'), ClassAccessGuard)，
// ClassAccessGuard 建構子需要 PrismaService，Nest 在編譯 TestingModule 時
// 會嘗試實例化這個 guard，因此這裡提供一個最小 mock 讓它可以被解析。
const mockPrismaService = {} as any;

const mockAttendanceService = {
  getAttendanceForClass: jest.fn(),
  recordClassAttendance: jest.fn(),
};

describe('AttendanceController', () => {
  let controller: AttendanceController;
  let service: AttendanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        { provide: AttendanceService, useValue: mockAttendanceService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<AttendanceController>(AttendanceController);
    service = module.get<AttendanceService>(AttendanceService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAttendanceForClass', () => {
    it('delegates to the service with the parsed classId and date', () => {
      const classId = 5;
      const dateString = '2026-01-15';
      const expectedResult = [{ studentId: 1, studentName: 'Alice', status: 'present' }];
      mockAttendanceService.getAttendanceForClass.mockReturnValue(expectedResult);

      const result = controller.getAttendanceForClass(classId, dateString);

      expect(service.getAttendanceForClass).toHaveBeenCalledWith(
        classId,
        new Date(dateString),
      );
      expect(result).toEqual(expectedResult);
    });

    it('defaults to the current date when no date query is provided', () => {
      const classId = 5;
      mockAttendanceService.getAttendanceForClass.mockReturnValue([]);

      controller.getAttendanceForClass(classId, undefined as unknown as string);

      const calledDate = mockAttendanceService.getAttendanceForClass.mock.calls[0][1];
      expect(calledDate).toBeInstanceOf(Date);
    });
  });

  describe('recordClassAttendance', () => {
    it('delegates to the service with classId, creatorId (from req.user), and the dto', () => {
      const classId = 7;
      const creatorId = 42;
      const req = { user: { userId: creatorId } };
      const submitDto: SubmitClassAttendanceDto = {
        attendanceDate: '2026-01-15',
        records: [{ studentId: 1, status: 'absent' as any, note: undefined }],
      };
      const expectedResult = { count: 1 };
      mockAttendanceService.recordClassAttendance.mockReturnValue(expectedResult);

      const result = controller.recordClassAttendance(req, classId, submitDto);

      expect(service.recordClassAttendance).toHaveBeenCalledWith(classId, creatorId, submitDto);
      expect(result).toEqual(expectedResult);
    });
  });
});
