// in src/leave-types/leave-types.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto } from './dto/leave-type.dto';

@Injectable()
export class LeaveTypesService {
    constructor(private prisma: PrismaService) {}

    findAll() {
        // 從資料庫中查詢所有 leaveType 紀錄
        return this.prisma.leaveType.findMany();
    }

    async create(data: CreateLeaveTypeDto) {
        return this.prisma.leaveType.create({
            data: {
                name: data.name,
                description: data.description || null
            }
        });
    }
    
    async update(id: number, data: UpdateLeaveTypeDto) {
        // 檢查記錄是否存在
        const leaveType = await this.prisma.leaveType.findUnique({
            where: { id }
        });
        
        if (!leaveType) {
            throw new NotFoundException(`LeaveType with ID ${id} not found`);
        }
        
        return this.prisma.leaveType.update({
            where: { id },
            data
        });
    }
    
    async remove(id: number) {
        // 檢查記錄是否存在
        const leaveType = await this.prisma.leaveType.findUnique({
            where: { id }
        });
        
        if (!leaveType) {
            throw new NotFoundException(`LeaveType with ID ${id} not found`);
        }
        
        return this.prisma.leaveType.delete({
            where: { id }
        });
    }
}