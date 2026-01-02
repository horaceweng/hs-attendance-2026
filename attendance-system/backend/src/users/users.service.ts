import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async findAllTeachers() {
        return this.prisma.user.findMany({
            where: { role: Role.teacher },
            select: {
                id: true,
                name: true
            },
            orderBy: { name: 'asc' }
        });
    }
    
    async findAllGASpecialists() {
        return this.prisma.user.findMany({
            where: { role: Role.GA_specialist },
            select: {
                id: true,
                name: true
            },
            orderBy: { name: 'asc' }
        });
    }
    
    async createUser(data: { name: string; role: Role }) {
        return this.prisma.user.create({
            data: {
                name: data.name,
                role: data.role
            },
            select: {
                id: true,
                name: true,
                role: true
            }
        });
    }
    
    async deleteUser(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                classAssignments: true,
                createdAttendanceRecords: true,
                createdLeaveRequests: true,
                approvedLeaveRequests: true
            }
        });
        
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        
        // Check if user has any related records that would prevent deletion
        if (user.classAssignments.length > 0 || 
            user.createdAttendanceRecords.length > 0 || 
            user.createdLeaveRequests.length > 0 || 
            user.approvedLeaveRequests.length > 0) {
            throw new Error('Cannot delete user with related records. Please reassign or delete the related records first.');
        }
        
        return this.prisma.user.delete({
            where: { id }
        });
    }
}