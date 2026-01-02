// in src/classes/classes.service.ts --- UPDATED

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class ClassesService {
    constructor(private prisma: PrismaService) {}

    async findAll(user: { userId: number; role: string }) {
        // 【偵錯日誌】將收到的 user 物件完整印出
        console.log('[ClassesService] Starting findAll. Received user object:', JSON.stringify(user));

        if (!user || !user.role) {
            console.log('[ClassesService] User object or user.role is missing. Returning empty array.');
            return [];
        }

        // 查詢當前活躍的學年
        const activeAcademicYear = await this.prisma.academicYear.findFirst({
            where: { isActive: true },
            select: { id: true, year: true }
        });
        
        console.log(`[ClassesService] Found active academic year:`, activeAcademicYear);
        
        if (!activeAcademicYear) {
            console.log('[ClassesService] No active academic year found. Returning all classes.');
            // 如果沒有活躍學年，則使用舊的邏輯
            if (user.role === 'GA_specialist') {
                return this.prisma.class.findMany({
                    orderBy: { id: 'asc' },
                });
            } else if (user.role === 'teacher') {
                return this.prisma.class.findMany({
                    where: {
                        teacherAssignments: {
                            some: {
                                teacherId: user.userId,
                                isActive: true,
                            },
                        },
                    },
                    orderBy: { id: 'asc' },
                });
            }
            return [];
        }

        // 使用活躍學年的年份來過濾班級
        const activeYear = activeAcademicYear.year;
        console.log(`[ClassesService] Filtering classes for active academic year: ${activeYear}`);

        if (user.role === 'GA_specialist') {
            console.log('[ClassesService] Condition met: user.role is GA_specialist. Returning classes from active academic year.');
            return this.prisma.class.findMany({
                where: { schoolYear: activeYear },
                orderBy: { id: 'asc' },
            });
        }

        if (user.role === 'teacher') {
            console.log(`[ClassesService] Condition met: user.role is teacher. Querying classes for teacherId: ${user.userId} from active academic year.`);
            return this.prisma.class.findMany({
                where: {
                    AND: [
                        { schoolYear: activeYear },
                        { teacherAssignments: {
                            some: {
                                teacherId: user.userId,
                                isActive: true,
                            },
                        }}
                    ]
                },
                orderBy: { id: 'asc' },
            });
        }

        console.log(`[ClassesService] No condition met for role: ${user.role}. Returning empty array.`);
        return [];
    }
    
    async checkIsAdmin(user: { userId: number; role: string }) {
        if (!user || user.role !== 'GA_specialist') {
            throw new ForbiddenException('Only administrators can perform this action');
        }
    }
    
    async create(data: { name: string; description?: string }, user: { userId: number; role: string }) {
        // 只有管理員可以創建班級
        await this.checkIsAdmin(user);
        
        // 根據模型，必須提供 gradeId 和 schoolYear
        // 由於這是管理介面的臨時實現，我們這裡使用預設值
        const currentYear = new Date().getFullYear();
        
        return this.prisma.class.create({
            data: {
                name: data.name,
                gradeId: 1,  // 默認第一個年級
                schoolYear: currentYear
            }
        });
    }
    
    async update(id: number, data: { name?: string; description?: string }, user: { userId: number; role: string }) {
        // 只有管理員可以更新班級
        await this.checkIsAdmin(user);
        
        // 檢查記錄是否存在
        const classRecord = await this.prisma.class.findUnique({
            where: { id }
        });
        
        if (!classRecord) {
            throw new NotFoundException(`Class with ID ${id} not found`);
        }
        
        return this.prisma.class.update({
            where: { id },
            data
        });
    }
    
    async remove(id: number, user: { userId: number; role: string }) {
        // 只有管理員可以刪除班級
        await this.checkIsAdmin(user);
        
        // 檢查記錄是否存在
        const classRecord = await this.prisma.class.findUnique({
            where: { id }
        });
        
        if (!classRecord) {
            throw new NotFoundException(`Class with ID ${id} not found`);
        }
        
        // 檢查是否有學生在這個班級
        const studentCount = await this.prisma.studentClassEnrollment.count({
            where: { classId: id }
        });
        
        if (studentCount > 0) {
            throw new ForbiddenException(`Cannot delete class with ID ${id} because it has ${studentCount} students`);
        }
        
        return this.prisma.class.delete({
            where: { id }
        });
    }
    
    async getClassTeachers(classId: number, user: { userId: number; role: string }) {
        // 先檢查班級是否存在
        const classRecord = await this.prisma.class.findUnique({
            where: { id: classId }
        });
        
        if (!classRecord) {
            throw new NotFoundException(`Class with ID ${classId} not found`);
        }
        
        // 返回這個班級的所有導師分配
        return this.prisma.teacherClassAssignment.findMany({
            where: { classId },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: [
                { isActive: 'desc' },
                { startDate: 'desc' }
            ]
        });
    }
    
    async assignTeacher(data: {
        classId: number;
        teacherId: number;
        schoolYear: string;
        startDate?: string | null;
        endDate?: string | null;
        isActive?: boolean;
        notes?: string | null;
    }, user: { userId: number; role: string }) {
        // 只有管理員可以指派導師
        await this.checkIsAdmin(user);
        
        // 檢查班級和老師是否存在
        const classRecord = await this.prisma.class.findUnique({
            where: { id: data.classId }
        });
        
        if (!classRecord) {
            throw new NotFoundException(`Class with ID ${data.classId} not found`);
        }
        
        const teacher = await this.prisma.user.findFirst({
            where: { 
                id: data.teacherId,
                role: Role.teacher
            }
        });
        
        if (!teacher) {
            throw new NotFoundException(`Teacher with ID ${data.teacherId} not found`);
        }
        
        // 處理日期
        const startDate = data.startDate ? new Date(data.startDate) : null;
        const endDate = data.endDate ? new Date(data.endDate) : null;
        
        // 建立導師分配
        return this.prisma.teacherClassAssignment.create({
            data: {
                teacherId: data.teacherId,
                classId: data.classId,
                schoolYear: data.schoolYear,
                startDate: startDate,
                endDate: endDate,
                isActive: data.isActive ?? true,
                notes: data.notes || null
            },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
    }
}