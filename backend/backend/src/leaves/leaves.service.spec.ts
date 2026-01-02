import { Test, TestingModule } from '@nestjs/testing';
import { LeavesService } from './leaves.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { LeaveRequestStatus } from '@prisma/client';

const mockPrismaService = {
  leaveRequest: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
};

describe('LeavesService', () => {
  let service: LeavesService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeavesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LeavesService>(LeavesService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('approve', () => {
    it('should approve a leave request', async () => {
      // Arrange
      const leaveId = 1;
      const approverId = 2;
      const mockLeaveRequest = { id: leaveId, status: LeaveRequestStatus.pending };
      mockPrismaService.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest);
      mockPrismaService.leaveRequest.update.mockResolvedValue({
        ...mockLeaveRequest,
        status: LeaveRequestStatus.approved,
        approvedById: approverId,
      });

      // Act
      const result = await service.approve(leaveId, approverId);

      // Assert
      expect(mockPrismaService.leaveRequest.findUnique).toHaveBeenCalledWith({
        where: { id: leaveId },
      });
      expect(mockPrismaService.leaveRequest.update).toHaveBeenCalledWith({
        where: { id: leaveId },
        data: {
          status: LeaveRequestStatus.approved,
          approvedById: approverId,
        },
      });
      expect(result.status).toBe(LeaveRequestStatus.approved);
    });

    it('should throw NotFoundException if leave request is not found', async () => {
      // Arrange
      const leaveId = 999;
      const approverId = 2;
      mockPrismaService.leaveRequest.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.approve(leaveId, approverId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('reject', () => {
    it('should reject a leave request', async () => {
      // Arrange
      const leaveId = 1;
      const approverId = 2;
      const reason = 'Rejection reason';
      const mockLeaveRequest = { 
        id: leaveId, 
        status: LeaveRequestStatus.pending,
        reason: 'Original reason'
      };
      mockPrismaService.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest);
      mockPrismaService.leaveRequest.update.mockResolvedValue({
        ...mockLeaveRequest,
        status: LeaveRequestStatus.rejected,
        approvedById: approverId,
        reason: reason,
      });

      // Act
      const result = await service.reject(leaveId, approverId, reason);

      // Assert
      expect(mockPrismaService.leaveRequest.findUnique).toHaveBeenCalledWith({
        where: { id: leaveId },
      });
      expect(mockPrismaService.leaveRequest.update).toHaveBeenCalledWith({
        where: { id: leaveId },
        data: {
          status: LeaveRequestStatus.rejected,
          approvedById: approverId,
          reason: reason,
        },
      });
      expect(result.status).toBe(LeaveRequestStatus.rejected);
    });

    it('should keep original reason when no rejection reason is provided', async () => {
      // Arrange
      const leaveId = 1;
      const approverId = 2;
      const originalReason = 'Original reason';
      const mockLeaveRequest = { 
        id: leaveId, 
        status: LeaveRequestStatus.pending,
        reason: originalReason
      };
      mockPrismaService.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest);
      mockPrismaService.leaveRequest.update.mockResolvedValue({
        ...mockLeaveRequest,
        status: LeaveRequestStatus.rejected,
        approvedById: approverId,
      });

      // Act
      await service.reject(leaveId, approverId);

      // Assert
      expect(mockPrismaService.leaveRequest.update).toHaveBeenCalledWith({
        where: { id: leaveId },
        data: {
          status: LeaveRequestStatus.rejected,
          approvedById: approverId,
          reason: originalReason,
        },
      });
    });

    it('should throw NotFoundException if leave request is not found', async () => {
      // Arrange
      const leaveId = 999;
      const approverId = 2;
      mockPrismaService.leaveRequest.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.reject(leaveId, approverId)).rejects.toThrow(NotFoundException);
    });
  });
});
