import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { GetAttendanceReportDto } from './dto/get-report.dto';
import { GetPendingLeavesDto } from './dto/get-pending-leaves.dto';
import { GetUnresolvedAbsencesDto } from './dto/get-unresolved-absences.dto';

const mockReportsService = {
  getUnresolvedAbsencesReport: jest.fn(),
  getPendingLeavesReport: jest.fn(),
  getAttendanceReport: jest.fn(),
};

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: mockReportsService }],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get<ReportsService>(ReportsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getUnresolvedAbsencesReport delegates to the service with the query dto', () => {
    const dto: GetUnresolvedAbsencesDto = { grades: ['10'] };
    const expected = [{ id: 1 }];
    mockReportsService.getUnresolvedAbsencesReport.mockReturnValue(expected);

    const result = controller.getUnresolvedAbsencesReport(dto);

    expect(service.getUnresolvedAbsencesReport).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('getPendingLeavesReport delegates to the service with the query dto', () => {
    const dto: GetPendingLeavesDto = { ageFilter: 'over_3_days' };
    const expected = [{ id: 2 }];
    mockReportsService.getPendingLeavesReport.mockReturnValue(expected);

    const result = controller.getPendingLeavesReport(dto);

    expect(service.getPendingLeavesReport).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('getAttendanceReport delegates to the service with the query dto', () => {
    const dto: GetAttendanceReportDto = { startDate: '2026-01-01', endDate: '2026-01-31' };
    const expected = [{ id: 'virtual-1-1' }];
    mockReportsService.getAttendanceReport.mockReturnValue(expected);

    const result = controller.getAttendanceReport(dto);

    expect(service.getAttendanceReport).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });
});
