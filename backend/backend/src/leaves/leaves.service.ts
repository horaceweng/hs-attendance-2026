import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { LeaveRequestStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeavesService {
    constructor(private prisma: PrismaService) {}

    async create(creatorId: number, createLeaveDto: CreateLeaveRequestDto) {
        try {
            // 將時間字串轉換為適當的格式
            const startDate = new Date(createLeaveDto.startDate);
            const endDate = new Date(createLeaveDto.endDate);
            
            // 如果有時間，創建帶時間的完整日期物件
            let startDateTime: Date | null = null;
            let endDateTime: Date | null = null;
            
            if (createLeaveDto.startTime && !createLeaveDto.isFullDay) {
                // 將 "08:00" 格式的時間轉換成完整的日期時間
                const [hours, minutes] = createLeaveDto.startTime.split(':').map(Number);
                startDateTime = new Date(startDate);
                startDateTime.setHours(hours, minutes, 0);
            }
            
            if (createLeaveDto.endTime && !createLeaveDto.isFullDay) {
                const [hours, minutes] = createLeaveDto.endTime.split(':').map(Number);
                endDateTime = new Date(endDate);
                endDateTime.setHours(hours, minutes, 0);
            }
            
            // 創建請假記錄
            return await this.prisma.leaveRequest.create({
                data: {
                    student: { connect: { id: createLeaveDto.studentId } },
                    leaveType: { connect: { id: createLeaveDto.leaveTypeId } },
                    startDate: startDate,
                    endDate: endDate,
                    reason: createLeaveDto.reason,
                    createdBy: { connect: { id: creatorId } },
                    // 只有在不是整天請假時才設置時間
                    ...(startDateTime ? { startTime: startDateTime } : {}),
                    ...(endDateTime ? { endTime: endDateTime } : {}),
                    isFullDay: createLeaveDto.isFullDay ?? true,
                } as any
            });
        } catch (error) {
            console.error('建立請假記錄時發生錯誤:', error);
            throw error;
        }
    }

    async approve(leaveId: number, approverId: number) {
        const leaveRequest = await this.prisma.leaveRequest.findUnique({
            where: { id: leaveId },
        });

        if (!leaveRequest) {
            throw new NotFoundException(`Leave request with ID ${leaveId} not found.`);
        }

        return this.prisma.leaveRequest.update({
            where: { id: leaveId },
            data: {
                status: LeaveRequestStatus.approved,
                approvedById: approverId,
            },
        });
    }

    async reject(leaveId: number, approverId: number, reason?: string) {
        const leaveRequest = await this.prisma.leaveRequest.findUnique({
            where: { id: leaveId },
        });

        if (!leaveRequest) {
            throw new NotFoundException(`Leave request with ID ${leaveId} not found.`);
        }

        return this.prisma.leaveRequest.update({
            where: { id: leaveId },
            data: {
                status: LeaveRequestStatus.rejected,
                approvedById: approverId,
                reason: reason || leaveRequest.reason, // Keep original reason if no rejection reason is provided
            },
        });
    }
}