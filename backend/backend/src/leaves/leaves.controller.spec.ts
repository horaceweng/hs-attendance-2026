import { Test, TestingModule } from '@nestjs/testing';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { RejectLeaveRequestDto } from './dto/reject-leave-request.dto';
import { LeaveRequestStatus } from '@prisma/client';

const mockLeavesService = {
  create: jest.fn(),
  approve: jest.fn(),
  reject: jest.fn(),
};

describe('LeavesController', () => {
  let controller: LeavesController;
  let service: LeavesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeavesController],
      providers: [
        {
          provide: LeavesService,
          useValue: mockLeavesService,
        },
      ],
    }).compile();

    controller = module.get<LeavesController>(LeavesController);
    service = module.get<LeavesService>(LeavesService);
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a leave request', async () => {
      // Arrange
      const createLeaveDto: CreateLeaveRequestDto = {
        studentId: 1,
        leaveTypeId: 2,
        startDate: '2025-06-01',
        endDate: '2025-06-02',
        reason: 'Sick leave',
      };
      const creatorId = 3;
      const req = { user: { userId: creatorId } };
      const expectedResult = {
        id: 1,
        ...createLeaveDto,
        createdById: creatorId,
        status: LeaveRequestStatus.pending,
      };
      mockLeavesService.create.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(req, createLeaveDto);

      // Assert
      expect(service.create).toHaveBeenCalledWith(creatorId, createLeaveDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('approve', () => {
    it('should approve a leave request', async () => {
      // Arrange
      const leaveId = 1;
      const approverId = 2;
      const req = { user: { userId: approverId } };
      const expectedResult = {
        id: leaveId,
        status: LeaveRequestStatus.approved,
        approvedById: approverId,
      };
      mockLeavesService.approve.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.approve(req, leaveId);

      // Assert
      expect(service.approve).toHaveBeenCalledWith(leaveId, approverId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('reject', () => {
    it('should reject a leave request', async () => {
      // Arrange
      const leaveId = 1;
      const approverId = 2;
      const rejectLeaveDto: RejectLeaveRequestDto = {
        reason: 'Rejection reason',
      };
      const req = { user: { userId: approverId } };
      const expectedResult = {
        id: leaveId,
        status: LeaveRequestStatus.rejected,
        approvedById: approverId,
        reason: rejectLeaveDto.reason,
      };
      mockLeavesService.reject.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.reject(req, leaveId, rejectLeaveDto);

      // Assert
      expect(service.reject).toHaveBeenCalledWith(leaveId, approverId, rejectLeaveDto.reason);
      expect(result).toEqual(expectedResult);
    });
  });
});
