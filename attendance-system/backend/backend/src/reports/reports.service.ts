// in src/reports/reports.service.ts --- FINAL LOGIC, ALIGNED WITH ATTENDANCE PAGE

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetAttendanceReportDto } from './dto/get-report.dto';
import { GetPendingLeavesDto } from './dto/get-pending-leaves.dto';
import { GetUnresolvedAbsencesDto } from './dto/get-unresolved-absences.dto'; // <-- 請加入這一行


export interface ReportRow {
  id: string;
  date: string;
  grade: string;
  className: string;
  studentName: string;
  status: string;
  leaveTypeName: string | null;
  leaveStatus: string | null;
  note: string | null;
}

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) {}

    async getAttendanceReport(queryDto: GetAttendanceReportDto): Promise<ReportRow[]> {
        const studentWhere: Prisma.StudentWhereInput = {};
        if (queryDto.grades && queryDto.grades.length > 0) {
            studentWhere.enrollments = {
                some: {
                    class: {
                        gradeId: { in: queryDto.grades.map(Number) },
                    },
                },
            };
        }

        const startDate = queryDto.startDate ? new Date(queryDto.startDate) : new Date();
        startDate.setUTCHours(0, 0, 0, 0);

        const endDate = queryDto.endDate ? new Date(queryDto.endDate) : new Date();
        endDate.setUTCHours(23, 59, 59, 999);

        const studentsInScope = await this.prisma.student.findMany({
            where: studentWhere,
            include: { 
                enrollments: { 
                    include: { 
                        class: { 
                            include: { grade: true } 
                        } 
                    } 
                } 
            },
        });

        if (studentsInScope.length === 0) return [];

        const studentIds = studentsInScope.map(s => s.id);

        const attendanceExceptions = await this.prisma.attendanceRecord.findMany({
            where: {
                studentId: { in: studentIds },
                attendanceDate: { gte: startDate, lte: endDate },
            },
            include: { leaveType: true },
        });

        // 【核心修正】將報表邏輯改回與每日點名頁一致，pending 和 approved 的假單都視為 on_leave 的基礎
        const leaveExceptions = await this.prisma.leaveRequest.findMany({
            where: {
                studentId: { in: studentIds },
                status: { in: ['approved', 'pending'] }, // <-- 同時考慮 pending 和 approved
                OR: [
                    { startDate: { lte: endDate }, endDate: { gte: startDate } },
                ],
            },
            include: { leaveType: true },
        });
        
        const fullReport: ReportRow[] = [];
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const currentDate = new Date(d);
            const reportYear = currentDate.getUTCFullYear();

            for (const student of studentsInScope) {
                const enrollment = student.enrollments.find(e => e.schoolYear === reportYear);
                if (!enrollment) continue;

                let finalStatus = 'present';
                let leaveTypeName: string | null = null;
                let note: string | null = null;
                let id = `virtual-${student.id}-${currentDate.getTime()}`;

                // find both leave and attendance exceptions for this student/date
                const attendance = attendanceExceptions.find(a => 
                    a.studentId === student.id &&
                    new Date(a.attendanceDate).getTime() === currentDate.getTime()
                );

                const leave = leaveExceptions.find(l => 
                    l.studentId === student.id &&
                    currentDate >= new Date(new Date(l.startDate).setUTCHours(0,0,0,0)) &&
                    currentDate <= new Date(new Date(l.endDate).setUTCHours(0,0,0,0))
                );

                // Leave should override attendance: if there's a leave covering the date,
                // report 'on_leave' regardless of an attendance record.
                if (leave) {
                    finalStatus = 'on_leave';
                    leaveTypeName = leave.leaveType.name;
                    id = `leave-${leave.id}`;
                } else if (attendance) {
                    finalStatus = attendance.status;
                    leaveTypeName = attendance.leaveType?.name || null;
                    note = attendance.note;
                    id = `att-${attendance.id}`;
                }
                
                // Determine leave status if it's a leave record
                let leaveStatus: string | null = null;
                if (finalStatus === 'on_leave') {
                    const leave = leaveExceptions.find(l => 
                        l.studentId === student.id &&
                        currentDate >= new Date(new Date(l.startDate).setUTCHours(0,0,0,0)) &&
                        currentDate <= new Date(new Date(l.endDate).setUTCHours(0,0,0,0))
                    );
                    if (leave) {
                        leaveStatus = leave.status;
                    }
                }
                
                fullReport.push({
                    id: id,
                    date: currentDate.toISOString().split('T')[0],
                    grade: enrollment.class.grade.name,
                    className: enrollment.class.name,
                    studentName: student.name,
                    status: finalStatus,
                    leaveTypeName: leaveTypeName,
                    leaveStatus: leaveStatus,
                    note: note,
                });
            }
        }
        
        if (queryDto.statuses && queryDto.statuses.length > 0) {
            const statusesToFilter = queryDto.statuses;
            return fullReport.filter(row => statusesToFilter.includes(row.status));
        }

        return fullReport.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    async getPendingLeavesReport(queryDto: GetPendingLeavesDto) {
        const where: Prisma.LeaveRequestWhereInput = {
            status: 'pending',
        };

        if (queryDto.ageFilter) {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            threeDaysAgo.setUTCHours(0, 0, 0, 0);

            if (queryDto.ageFilter === 'within_3_days') {
                where.createdAt = { gte: threeDaysAgo };
            } else if (queryDto.ageFilter === 'over_3_days') {
                where.createdAt = { lt: threeDaysAgo };
            }
        }
        
        // 年級篩選邏輯
        if (queryDto.grades && queryDto.grades.length > 0) {
            where.student = {
                enrollments: { 
                    some: { 
                        class: { gradeId: { in: queryDto.grades.map(Number) } } 
                    } 
                }
            };
        }

        return this.prisma.leaveRequest.findMany({
            where,
            include: { student: true, leaveType: true },
            orderBy: { createdAt: 'asc' },
        });
    }

    async getUnresolvedAbsencesReport(queryDto: GetUnresolvedAbsencesDto) {
    const where: Prisma.AttendanceRecordWhereInput = {
        status: 'absent',
    };

    if (queryDto.grades && queryDto.grades.length > 0) {
        where.class = {
            gradeId: { in: queryDto.grades.map(Number) }
        };
    }

    const absentRecords = await this.prisma.attendanceRecord.findMany({
        where,
        include: {
            student: true,
            class: true,
        },
    });

    if (absentRecords.length === 0) {
        return [];
    }

    const studentIds = absentRecords.map(ar => ar.studentId);
    const leaveRequests = await this.prisma.leaveRequest.findMany({
        where: {
            studentId: { in: studentIds },
        },
    });

    // 【核心修正】改用標準化的時間戳來進行日期比對
    const unresolvedAbsences = absentRecords.filter(absentRecord => {
        // 將缺席日期標準化為 UTC 的午夜時間戳 (一個純數字)
        const absenceDateTime = new Date(absentRecord.attendanceDate).setUTCHours(0, 0, 0, 0);

        const hasMatchingLeaveRequest = leaveRequests.some(leave => {
            // 先確認是同一個學生
            if (leave.studentId !== absentRecord.studentId) {
                return false;
            }

            // 也將請假開始和結束日期標準化為 UTC 午夜時間戳
            const leaveStartDateTime = new Date(leave.startDate).setUTCHours(0, 0, 0, 0);
            const leaveEndDateTime = new Date(leave.endDate).setUTCHours(0, 0, 0, 0);

            // 進行純數字的比對，排除所有時區和格式問題
            return absenceDateTime >= leaveStartDateTime && absenceDateTime <= leaveEndDateTime;
        });

        // 如果找不到任何一筆涵蓋當天的假單，就回傳 true (保留這筆缺席紀錄)
        return !hasMatchingLeaveRequest;
    });

    return unresolvedAbsences.sort((a,b) => b.attendanceDate.getTime() - a.attendanceDate.getTime());
    }
}