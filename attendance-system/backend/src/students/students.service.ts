import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudentStatus } from '@prisma/client';

@Injectable()
export class StudentsService {
    constructor(private prisma: PrismaService) {}

    // 根據 classId 查詢學生
    findAllByClass(classId: number) {
        return this.prisma.student.findMany({
            where: {
                enrollments: {
                    some: {
                        classId: classId,
                    },
                },
            },
        });
    }
    
    // 獲取所有學生資料，可選根據狀態過濾，可選包含班級註冊資訊
    findAll(status?: string, includeEnrollments?: boolean) {
        const where = status && status !== 'all' 
            ? { status: status as StudentStatus } 
            : {};
            
        return this.prisma.student.findMany({
            where,
            include: includeEnrollments ? {
                enrollments: {
                    include: {
                        class: {
                            include: {
                                grade: true
                            }
                        }
                    },
                    orderBy: {
                        id: 'desc'
                    }
                }
            } : undefined,
            orderBy: [
                { name: 'asc' }
            ],
        });
    }
    
    // 獲取單一學生資料
    findOne(id: number) {
        return this.prisma.student.findUnique({
            where: { id },
            include: {
                enrollments: {
                    include: {
                        class: true
                    }
                }
            }
        });
    }
    
    // 新增學生資料
    create(data: any) {
        return this.prisma.student.create({
            data: {
                studentId: data.studentId,
                name: data.name,
                birthday: new Date(data.birthday),
                gender: data.gender,
                status: data.status,
                enrollmentDate: new Date(data.enrollmentDate),
                departureDate: data.departureDate ? new Date(data.departureDate) : null,
                departureReason: data.departureReason || null,
            }
        });
    }
    
    // 更新學生資料
    update(id: number, data: any) {
        return this.prisma.student.update({
            where: { id },
            data: {
                name: data.name,
                birthday: new Date(data.birthday),
                gender: data.gender,
                status: data.status,
                enrollmentDate: new Date(data.enrollmentDate),
                departureDate: data.departureDate ? new Date(data.departureDate) : null,
                departureReason: data.departureReason || null,
            }
        });
    }
    
    // 刪除學生資料
    async remove(id: number) {
        // 刪除學生相關的出缺勤紀錄
        await this.prisma.attendanceRecord.deleteMany({
            where: { studentId: id }
        });
        
        // 刪除學生相關的請假申請
        await this.prisma.leaveRequest.deleteMany({
            where: { studentId: id }
        });
        
        // 刪除學生的班級註冊
        await this.prisma.studentClassEnrollment.deleteMany({
            where: { studentId: id }
        });
        
        // 刪除學生本身
        return this.prisma.student.delete({
            where: { id }
        });
    }
    
    // 獲取學生的班級註冊記錄
    getStudentEnrollments(studentId: number) {
        return this.prisma.studentClassEnrollment.findMany({
            where: {
                studentId
            },
            include: {
                class: {
                    include: {
                        grade: true
                    }
                }
            },
            orderBy: {
                id: 'desc'
            }
        });
    }
    
    // 創建學生班級註冊
    createStudentEnrollment(data: any) {
        return this.prisma.studentClassEnrollment.create({
            data: {
                studentId: data.studentId,
                classId: data.classId,
                schoolYear: data.schoolYear
            }
        });
    }
    
    // 更新學生班級註冊
    updateStudentEnrollment(id: number, data: any) {
        return this.prisma.studentClassEnrollment.update({
            where: { id },
            data: {
                classId: data.classId,
                schoolYear: data.schoolYear
            }
        });
    }
    
    // 刪除學生班級註冊
    removeStudentEnrollment(id: number) {
        return this.prisma.studentClassEnrollment.delete({
            where: { id }
        });
    }
}