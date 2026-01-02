// in src/statistics/statistics.service.ts
import { Injectable } from '@nestjs/common';
import { Prisma, AttendanceStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetStatisticsReportDto } from './dto/get-statistics.dto';
import { 
  GetAttendanceStatsDto,
  AttendanceStatistics,
  ClassAttendanceStatistics,
  StudentAttendanceStatistics,
  DateAttendanceStatistics 
} from './dto';

// 回傳的統計資料結構
export interface StatisticsReportRow {
  studentId: number;
  studentName: string;
  grade: string;
  className: string;
  leaveTypeCounts: {
    [type: string]: {
      // 按狀態分類的統計
      approved: { days: number; hours: number };
      pending: { days: number; hours: number };
      rejected: { days: number; hours: number };
      // 合計
      total: { days: number; hours: number };
    }
  };
  lateDays: number;
  leaveEarlyDays: number;
  absentDays: number;
  totalDays: number;
}

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getStatisticsReport(queryDto: GetStatisticsReportDto): Promise<StatisticsReportRow[]> {
    // 取得時間範圍（根據學期資訊）
    let startDate: Date;
    let endDate: Date;
    
    // 如果沒有提供學期資訊，使用目前學期
    if (!queryDto.academicYear || !queryDto.term) {
      const currentSemester = await this.getCurrentSemester();
      if (currentSemester) {
        startDate = currentSemester.startDate;
        endDate = currentSemester.endDate;
      } else {
        // 沒有找到目前學期，使用當前日期的前後一個月
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
      }
    } else {
      // TODO: 根據提供的學年和學期資訊找出正確的日期範圍
      // 這部分需要實作 semester 相關功能後再完成
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
    }
    
    // 找出在範圍內的所有學生
    // 移除 status 條件，因為 StudentWhereInput 目前不支持此屬性
    const studentWhere: Prisma.StudentWhereInput = {
      // 暫時不根據 status 過濾
    };
    
    if (queryDto.studentId) {
      studentWhere.id = queryDto.studentId;
    }
    
    if (queryDto.grades && queryDto.grades.length > 0) {
      studentWhere.enrollments = {
        some: {
          class: {
            gradeId: { in: queryDto.grades.map(Number) },
          },
        },
      };
    }
    
    const students = await this.prisma.student.findMany({
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
    
    if (students.length === 0) return [];
    
    // 取得學生 ID 列表用於後續查詢
    const studentIds = students.map(s => s.id);
    
    // 查詢所有假日
    const holidays = await this.getHolidaysInRange(startDate, endDate);
    const holidayDates = new Set<string>(holidays.map(h => this.formatDate(h.date)));
    
    // 查詢出缺勤紀錄
    const attendanceRecords = await this.prisma.attendanceRecord.findMany({
      where: {
        studentId: { in: studentIds },
        attendanceDate: { gte: startDate, lte: endDate },
      },
      include: { leaveType: true },
    });
    
    // 查詢請假紀錄 (所有狀態)
    const leaveRequests = await this.prisma.leaveRequest.findMany({
      where: {
        studentId: { in: studentIds },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
      },
      include: { 
        leaveType: true
      },
    });
    
    // 計算每個學生的統計數據
    const statisticsReport: StatisticsReportRow[] = [];
    
    for (const student of students) {
      const currentYear = new Date().getFullYear();
      const enrollment = student.enrollments.find(e => e.schoolYear === currentYear);
      if (!enrollment) continue;
      
      // 初始化統計數據
      const leaveTypeCounts: {
        [type: string]: {
          approved: { days: number; hours: number };
          pending: { days: number; hours: number };
          rejected: { days: number; hours: number };
          total: { days: number; hours: number };
        }
      } = {};
      let lateDays = 0;
      let leaveEarlyDays = 0;
      let absentDays = 0;
      
      // 統計出缺勤紀錄
      for (const record of attendanceRecords.filter(r => r.studentId === student.id)) {
        const dateStr = this.formatDate(record.attendanceDate);
        if (holidayDates.has(dateStr)) continue; // 跳過假日
        
        switch (record.status) {
          case 'late':
            lateDays++;
            break;
          case 'leave_early':
            leaveEarlyDays++;
            break;
          case 'absent':
            absentDays++;
            break;
          case 'on_leave':
            if (record.leaveTypeId && record.leaveType) {
              const leaveTypeName = record.leaveType.name;
              
              // 初始化這個假別的所有狀態
              if (!leaveTypeCounts[leaveTypeName]) {
                leaveTypeCounts[leaveTypeName] = {
                  approved: { days: 0, hours: 0 },
                  pending: { days: 0, hours: 0 },
                  rejected: { days: 0, hours: 0 },
                  total: { days: 0, hours: 0 }
                };
              }
              
              // 從出勤紀錄來的都視為已核准
              leaveTypeCounts[leaveTypeName].approved.days += 1;
              leaveTypeCounts[leaveTypeName].total.days += 1;
            }
            break;
        }
      }
      
      // 統計所有請假紀錄 (包含所有狀態)
      for (const leave of leaveRequests.filter(l => l.studentId === student.id)) {
        const leaveTypeName = leave.leaveType.name;
        const leaveStatus = leave.status; // 'approved', 'pending', 'rejected'
        
        // 確保初始化這個假別的所有狀態
        if (!leaveTypeCounts[leaveTypeName]) {
          leaveTypeCounts[leaveTypeName] = {
            approved: { days: 0, hours: 0 },
            pending: { days: 0, hours: 0 },
            rejected: { days: 0, hours: 0 },
            total: { days: 0, hours: 0 }
          };
        }
        
        // 計算實際請假天數（排除假日）
        const leaveDays = this.calculateLeaveDays(leave.startDate, leave.endDate, holidayDates);
        
        // 由于 Prisma 可能没有正确生成 TypeScript 类型，我们在这里直接使用 any 类型
        const leaveAny = leave as any;
        
        // 處理全天請假
        if (leaveAny.isFullDay) {
          // 根據請假狀態增加天數
          if (leaveStatus === 'approved') {
            leaveTypeCounts[leaveTypeName].approved.days += leaveDays;
          } else if (leaveStatus === 'pending') {
            leaveTypeCounts[leaveTypeName].pending.days += leaveDays;
          } else if (leaveStatus === 'rejected') {
            leaveTypeCounts[leaveTypeName].rejected.days += leaveDays;
          }
          
          // 總計也要增加
          leaveTypeCounts[leaveTypeName].total.days += leaveDays;
        } else {
          // 處理時數請假
          if (leaveAny.startTime && leaveAny.endTime) {
            const hours = this.calculateLeaveHours(leaveAny.startTime, leaveAny.endTime) * leaveDays;
            
            // 根據請假狀態增加時數
            if (leaveStatus === 'approved') {
              leaveTypeCounts[leaveTypeName].approved.hours += hours;
            } else if (leaveStatus === 'pending') {
              leaveTypeCounts[leaveTypeName].pending.hours += hours;
            } else if (leaveStatus === 'rejected') {
              leaveTypeCounts[leaveTypeName].rejected.hours += hours;
            }
            
            // 總計也要增加
            leaveTypeCounts[leaveTypeName].total.hours += hours;
            
            // 處理所有狀態的時數轉換成天數 (如果超過8小時)
            for (const status of ['approved', 'pending', 'rejected', 'total']) {
              const standardHoursPerDay = 8;
              const additionalDays = Math.floor(leaveTypeCounts[leaveTypeName][status].hours / standardHoursPerDay);
              
              if (additionalDays > 0) {
                leaveTypeCounts[leaveTypeName][status].days += additionalDays;
                leaveTypeCounts[leaveTypeName][status].hours %= standardHoursPerDay;
              }
            }
          }
        }
      }
      
      // 計算總出席天數（排除假日）
      const totalDays = this.calculateTotalDays(startDate, endDate, holidayDates);
      
      statisticsReport.push({
        studentId: student.id,
        studentName: student.name,
        grade: enrollment.class.grade.name,
        className: enrollment.class.name,
        leaveTypeCounts,
        lateDays,
        leaveEarlyDays,
        absentDays,
        totalDays,
      });
    }
    
    return statisticsReport;
  }
  
  // 獲取當前學期
  private async getCurrentSemester() {
    // 使用 as any 繞過 TypeScript 檢查
    return (this.prisma as any).semester.findFirst({
      where: { isActive: true },
      orderBy: { startDate: 'desc' },
    });
  }
  
  // 獲取日期範圍內的假日
  private async getHolidaysInRange(startDate: Date, endDate: Date) {
    // 使用 as any 繞過 TypeScript 檢查
    return (this.prisma as any).holiday.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
    });
  }
  
  // 計算請假天數（排除假日和週末）
  private calculateLeaveDays(startDate: Date, endDate: Date, holidayDates: Set<string>): number {
    let days = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = this.formatDate(currentDate);
      const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 6 is Saturday
      
      // 如果不是週末（星期六或星期日）且不是假日，則計數
      if (!holidayDates.has(dateStr) && dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }
  
  // 計算總天數（排除假日和週末）
  private calculateTotalDays(startDate: Date, endDate: Date, holidayDates: Set<string>): number {
    let days = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = this.formatDate(currentDate);
      const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 6 is Saturday
      
      // 如果不是週末（星期六或星期日）且不是假日，則計數
      if (!holidayDates.has(dateStr) && dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }
  
  // 計算請假時數
  private calculateLeaveHours(startTime: Date, endTime: Date): number {
    const startHours = startTime.getHours() + startTime.getMinutes() / 60;
    const endHours = endTime.getHours() + endTime.getMinutes() / 60;
    return endHours - startHours;
  }
  
  // 格式化日期為字串 (YYYY-MM-DD)
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  // New attendance statistics methods
  
  async getAttendanceStatistics(queryDto: GetAttendanceStatsDto): Promise<AttendanceStatistics> {
    // Get date range from query or use default range (current month)
    const { startDate, endDate } = await this.getDateRange(queryDto);
    
    // Build the query conditions based on the queryDto
    const where: any = {
      attendanceDate: { 
        gte: new Date(startDate), 
        lte: new Date(endDate) 
      }
    };
    
    if (queryDto.classId) {
      where.classId = parseInt(queryDto.classId.toString());
    }
    
    if (queryDto.studentId) {
      where.studentId = parseInt(queryDto.studentId.toString());
    }
    
    // Get all attendance records in the date range
    const attendanceRecords = await this.prisma.attendanceRecord.findMany({ where });
    
    // Count days by status
    const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
    const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;
    const lateDays = attendanceRecords.filter(r => r.status === 'late').length;
    const leaveEarlyDays = attendanceRecords.filter(r => r.status === 'leave_early').length;
    const onLeaveDays = attendanceRecords.filter(r => r.status === 'on_leave').length;
    const totalDays = attendanceRecords.length;
    
    // Calculate attendance rate
    const attendanceRate = totalDays > 0 
      ? parseFloat(((presentDays / totalDays) * 100).toFixed(2))
      : 0;
    
    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      leaveEarlyDays,
      onLeaveDays,
      attendanceRate
    };
  }

  async getAttendanceStatisticsByClass(queryDto: GetAttendanceStatsDto): Promise<ClassAttendanceStatistics[]> {
    // Get date range from query or use default range (current month)
    const { startDate, endDate } = await this.getDateRange(queryDto);
    
    // First, get all classes
    const classes = await this.prisma.class.findMany({
      include: { grade: true }
    });
    
    // Get attendance stats for each class
    const result: ClassAttendanceStatistics[] = [];
    
    for (const classInfo of classes) {
      // Build query for this class
      const classQuery: GetAttendanceStatsDto = {
        ...queryDto,
        classId: classInfo.id,
        startDate,
        endDate
      };
      
      // Get statistics for this class
      const stats = await this.getAttendanceStatistics(classQuery);
      
      result.push({
        ...stats,
        classId: classInfo.id,
        className: classInfo.name,
        gradeId: classInfo.gradeId,
        gradeName: classInfo.grade.name
      });
    }
    
    return result;
  }

  async getAttendanceStatisticsByStudent(queryDto: GetAttendanceStatsDto): Promise<StudentAttendanceStatistics[]> {
    // Get date range from query or use default range (current month)
    const { startDate, endDate } = await this.getDateRange(queryDto);
    
    // Build where condition for students
    const where: any = {};
    if (queryDto.classId) {
      where.enrollments = {
        some: {
          classId: parseInt(queryDto.classId.toString())
        }
      };
    }
    
    // Get all students (with filter if class specified)
    const students = await this.prisma.student.findMany({
      where,
      include: {
        enrollments: {
          include: {
            class: true
          }
        }
      }
    });
    
    // Get attendance stats for each student
    const result: StudentAttendanceStatistics[] = [];
    
    for (const student of students) {
      // Get the current enrollment
      const enrollment = student.enrollments[0]; // Assuming one active enrollment per student
      if (!enrollment) continue;
      
      // Build query for this student
      const studentQuery: GetAttendanceStatsDto = {
        ...queryDto,
        studentId: student.id,
        startDate,
        endDate
      };
      
      // Get statistics for this student
      const stats = await this.getAttendanceStatistics(studentQuery);
      
      result.push({
        ...stats,
        studentId: student.id,
        studentName: student.name,
        classId: enrollment.classId,
        className: enrollment.class.name
      });
    }
    
    return result;
  }

  async getAttendanceStatisticsByDate(queryDto: GetAttendanceStatsDto): Promise<DateAttendanceStatistics[]> {
    // Get date range from query or use default range (current month)
    const { startDate, endDate } = await this.getDateRange(queryDto);
    
    // Generate all dates in the range
    const dates = this.generateDateRange(new Date(startDate), new Date(endDate));
    
    // Build where condition for attendance records
    const where: any = {
      attendanceDate: { 
        gte: new Date(startDate), 
        lte: new Date(endDate) 
      }
    };
    
    if (queryDto.classId) {
      where.classId = parseInt(queryDto.classId.toString());
    }
    
    // Get all attendance records in the date range
    const attendanceRecords = await this.prisma.attendanceRecord.findMany({ where });
    
    // Get total number of students for calculating attendance rate
    const totalStudentsQuery: any = {};
    if (queryDto.classId) {
      totalStudentsQuery.classId = parseInt(queryDto.classId.toString());
    }
    
    const totalStudentsCount = await this.prisma.studentClassEnrollment.count({
      where: totalStudentsQuery
    });
    
    // Group attendance records by date and status
    const result: DateAttendanceStatistics[] = [];
    
    for (const date of dates) {
      const dateStr = this.formatDate(date);
      const recordsForDate = attendanceRecords.filter(
        r => this.formatDate(r.attendanceDate) === dateStr
      );
      
      const presentCount = recordsForDate.filter(r => r.status === 'present').length;
      const absentCount = recordsForDate.filter(r => r.status === 'absent').length;
      const lateCount = recordsForDate.filter(r => r.status === 'late').length;
      const leaveEarlyCount = recordsForDate.filter(r => r.status === 'leave_early').length;
      const onLeaveCount = recordsForDate.filter(r => r.status === 'on_leave').length;
      
      const attendanceRate = totalStudentsCount > 0 
        ? parseFloat(((presentCount / totalStudentsCount) * 100).toFixed(2))
        : 0;
      
      result.push({
        date: dateStr,
        totalStudents: totalStudentsCount,
        presentCount,
        absentCount,
        lateCount,
        leaveEarlyCount,
        onLeaveCount,
        attendanceRate
      });
    }
    
    return result;
  }
  
  // Helper method to get date range from query or use defaults
  private async getDateRange(queryDto: GetAttendanceStatsDto): Promise<{ startDate: string, endDate: string }> {
    if (queryDto.startDate && queryDto.endDate) {
      return { 
        startDate: queryDto.startDate,
        endDate: queryDto.endDate
      };
    }
    
    // If season is provided, use season start/end dates
    if (queryDto.seasonId) {
      const season = await this.prisma.$queryRaw`
        SELECT start_date, end_date FROM seasons WHERE id = ${queryDto.seasonId}
      `;
      
      if (Array.isArray(season) && season.length > 0) {
        const seasonData = season[0] as any;
        return {
          startDate: this.formatDate(new Date(seasonData.start_date)),
          endDate: this.formatDate(new Date(seasonData.end_date))
        };
      }
    }
    
    // Default: Use current month
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    return {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate)
    };
  }
  
  // Helper method to generate array of dates between start and end
  private generateDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }
}