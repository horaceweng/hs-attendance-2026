// 請確認 backend/src/attendance/attendance.service.ts 的內容如下：

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SubmitClassAttendanceDto } from './dto/submit-attendance.dto';

@Injectable()
export class AttendanceService {
    constructor(private prisma: PrismaService) {}

    async getAttendanceForClass(classId: number, date: Date) {
        const students = await this.prisma.student.findMany({
            where: { enrollments: { some: { classId } } },
        });
        if (students.length === 0) return [];
        const studentIds = students.map((s) => s.id);
        const leaveRequests = await this.prisma.leaveRequest.findMany({
            where: {
                studentId: { in: studentIds },
                status: { in: ['approved', 'pending'] },
                startDate: { lte: date },
                endDate: { gte: date },
            },
        });
        const onLeaveStudentIds = new Set(leaveRequests.map((lr) => lr.studentId));
        const attendanceRecords = await this.prisma.attendanceRecord.findMany({
            where: { studentId: { in: studentIds }, attendanceDate: date },
        });
        const attendanceMap = new Map(attendanceRecords.map((ar) => [ar.studentId, ar.status]));
        const finalAttendanceList = students.map((student) => {
            let status: string;
            if (onLeaveStudentIds.has(student.id)) {
                status = 'on_leave';
            } else {
                status = attendanceMap.get(student.id) || 'present';
            }
            return { studentId: student.id, studentName: student.name, status: status };
        });
        return finalAttendanceList;
    }
    
    async recordClassAttendance(classId: number, creatorId: number, dto: SubmitClassAttendanceDto) {
        const { attendanceDate, records } = dto;
        const date = new Date(attendanceDate);
        const onLeaveStudentIds = new Set(
            (await this.prisma.leaveRequest.findMany({
                where: {
                    status: { in: ['approved', 'pending'] },
                    student: { enrollments: { some: { classId } } },
                    startDate: { lte: date },
                    endDate: { gte: date },
                },
                select: { studentId: true },
            })).map(lr => lr.studentId)
        );
        const recordsToUpsert = records.filter(record => !onLeaveStudentIds.has(record.studentId));
        return this.prisma.$transaction(
            recordsToUpsert.map((record) => 
                this.prisma.attendanceRecord.upsert({
                    where: { studentId_attendanceDate: { studentId: record.studentId, attendanceDate: date } },
                    update: { status: record.status, note: record.note },
                    create: {
                        studentId: record.studentId,
                        classId: classId,
                        attendanceDate: date,
                        status: record.status,
                        note: record.note,
                        createdById: creatorId,
                    },
                })
            )
        );
    }
}