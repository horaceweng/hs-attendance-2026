// in src/statistics/statistics.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Prisma, AttendanceStatus, AcademicYear } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AcademicService } from 'src/academic/academic.service';
import { GetStatisticsReportDto } from './dto/get-statistics.dto';
import {
  GetAttendanceStatsDto,
  AttendanceStatistics,
  ClassAttendanceStatistics,
  StudentAttendanceStatistics,
  DateAttendanceStatistics
} from './dto';

// 學年/學期查詢後得到的日期區間
interface AcademicPeriod {
  startDate: Date;
  endDate: Date;
}

// $queryRaw 查詢 seasons 表所得到的單筆日期區間（原始欄位為 snake_case）
interface SeasonDateRangeRow {
  start_date: Date;
  end_date: Date;
}

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
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    private prisma: PrismaService,
    private academicService: AcademicService,
  ) {}

  async getStatisticsReport(queryDto: GetStatisticsReportDto): Promise<StatisticsReportRow[]> {
    // 取得時間範圍（根據學年/學期資訊，對應到 AcademicYear/Season 資料模型）
    let startDate: Date;
    let endDate: Date;

    // 有指定學年或學期時，優先查詢對應區間；否則以「今天所屬的學年/學期」為準
    const explicitPeriod = (queryDto.academicYear || queryDto.term)
      ? await this.resolvePeriodFromParams(queryDto.academicYear, queryDto.term)
      : null;

    const period = explicitPeriod ?? (await this.getCurrentAcademicPeriod());

    if (period) {
      startDate = period.startDate;
      endDate = period.endDate;
    } else {
      // 找不到任何學年/學期資料（例如系統尚未建立），退回目前日期前後一個月，避免直接回傳 500
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

    // 預先載入所有學年設定，供下方逐一學生解析註冊紀錄時查找，
    // 避免每位學生都對資料庫查詢一次（見 AcademicService.buildAcademicYearLookup）。
    const academicYears = await this.academicService.buildAcademicYearLookup();

    for (const student of students) {
      // 以報表區間的結束日期解析學生對應的班級註冊紀錄，
      // 取代原本寫死「目前年份」的邏輯（歷史報表不應該用「現在」的學年去比對）。
      const enrollment = await this.academicService.resolveEnrollment(
        student,
        endDate,
        academicYears,
      );
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
        
        // 處理全天請假
        if (leave.isFullDay) {
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
          if (leave.startTime && leave.endTime) {
            const hours = this.calculateLeaveHours(leave.startTime, leave.endTime) * leaveDays;
            
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
  
  // 根據查詢參數（學年年度、學期）解析出對應的日期區間
  // academicYear：學年年度（例如 "2025"）；term：'first'（上學期）或 'second'（下學期）
  private async resolvePeriodFromParams(
    academicYearParam?: string,
    termParam?: string,
  ): Promise<AcademicPeriod | null> {
    let academicYear: AcademicYear | null = null;

    if (academicYearParam) {
      const year = parseInt(academicYearParam, 10);
      if (!Number.isNaN(year)) {
        try {
          const academicYearId = await this.academicService.findAcademicYearByYear(year);
          academicYear = await this.prisma.academicYear.findUnique({ where: { id: academicYearId } });
        } catch (error) {
          // 查無此學年，記錄後回傳 null，讓外層改用 fallback 邏輯
          this.logger.warn(`找不到學年年度為 ${year} 的資料，改用預設區間：${error.message}`);
          academicYear = null;
        }
      }
    } else if (termParam) {
      // 只提供學期、沒有提供學年年度時，以今天所屬的學年為準
      academicYear = await this.findAcademicYearForDate(new Date());
    }

    if (!academicYear) return null;

    if (!termParam) {
      // 只指定學年，使用整個學年的區間
      return { startDate: academicYear.startDate, endDate: academicYear.endDate };
    }

    return this.resolveTermPeriod(academicYear, termParam);
  }

  // 依 AcademicYear 底下的 Season 資料，換算出上/下學期的日期區間
  // 一個學年若建立 2 筆 Season（上/下學期），前段對應上學期、後段對應下學期；
  // 若建立 4 筆（四季），則前半（例如秋、冬）視為上學期、後半（例如春、夏）視為下學期
  private async resolveTermPeriod(academicYear: AcademicYear, termParam: string): Promise<AcademicPeriod> {
    const seasons = await this.prisma.season.findMany({
      where: { academicYearId: academicYear.id },
      orderBy: { startDate: 'asc' },
    });

    if (seasons.length === 0) {
      // 該學年尚未建立 Season 資料，退回整學年區間
      return { startDate: academicYear.startDate, endDate: academicYear.endDate };
    }

    const half = Math.ceil(seasons.length / 2);
    const termSeasons = termParam === 'second' ? seasons.slice(half) : seasons.slice(0, half);
    const targetSeasons = termSeasons.length > 0 ? termSeasons : seasons;

    const startDate = targetSeasons.reduce(
      (min, s) => (s.startDate < min ? s.startDate : min),
      targetSeasons[0].startDate,
    );
    const endDate = targetSeasons.reduce(
      (max, s) => (s.endDate > max ? s.endDate : max),
      targetSeasons[0].endDate,
    );

    return { startDate, endDate };
  }

  // 找出「今天」所屬的學年/學期，做為未提供查詢參數時的預設區間
  private async getCurrentAcademicPeriod(): Promise<AcademicPeriod | null> {
    const today = new Date();

    // 優先找出今天所屬的 Season（學期）
    const currentSeason = await this.prisma.season.findFirst({
      where: { startDate: { lte: today }, endDate: { gte: today } },
      orderBy: { startDate: 'desc' },
    });

    if (currentSeason) {
      return { startDate: currentSeason.startDate, endDate: currentSeason.endDate };
    }

    // 找不到符合的 Season（例如尚未建立學期資料），退而使用今天所屬的學年區間
    const currentAcademicYear = await this.findAcademicYearForDate(today);
    if (currentAcademicYear) {
      return { startDate: currentAcademicYear.startDate, endDate: currentAcademicYear.endDate };
    }

    return null;
  }

  // 找出某個日期所屬的 AcademicYear
  private async findAcademicYearForDate(date: Date): Promise<AcademicYear | null> {
    return this.prisma.academicYear.findFirst({
      where: { startDate: { lte: date }, endDate: { gte: date } },
      orderBy: { startDate: 'desc' },
    });
  }

  // 獲取日期範圍內的假日
  private async getHolidaysInRange(startDate: Date, endDate: Date) {
    return this.prisma.holiday.findMany({
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
    const where: Prisma.AttendanceRecordWhereInput = {
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

    return this.computeAttendanceStatistics(attendanceRecords);
  }

  // 依出缺勤紀錄計算統計數字，供單一查詢與分組統計共用
  private computeAttendanceStatistics(
    attendanceRecords: { status: AttendanceStatus }[],
  ): AttendanceStatistics {
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

    // 一次撈取範圍內所有出缺勤紀錄，再於記憶體中依班級分組，避免逐班查詢造成 N+1
    const where: Prisma.AttendanceRecordWhereInput = {
      attendanceDate: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    };

    if (queryDto.studentId) {
      where.studentId = parseInt(queryDto.studentId.toString());
    }

    const attendanceRecords = await this.prisma.attendanceRecord.findMany({ where });

    // 依班級 ID 分組
    const recordsByClassId = new Map<number, typeof attendanceRecords>();
    for (const record of attendanceRecords) {
      const records = recordsByClassId.get(record.classId) ?? [];
      records.push(record);
      recordsByClassId.set(record.classId, records);
    }

    // 針對每個班級，從分組後的紀錄計算統計數字（不再逐班查詢資料庫）
    return classes.map(classInfo => {
      const stats = this.computeAttendanceStatistics(recordsByClassId.get(classInfo.id) ?? []);

      return {
        ...stats,
        classId: classInfo.id,
        className: classInfo.name,
        gradeId: classInfo.gradeId,
        gradeName: classInfo.grade.name
      };
    });
  }

  async getAttendanceStatisticsByStudent(queryDto: GetAttendanceStatsDto): Promise<StudentAttendanceStatistics[]> {
    // Get date range from query or use default range (current month)
    const { startDate, endDate } = await this.getDateRange(queryDto);
    
    // Build where condition for students
    const where: Prisma.StudentWhereInput = {};
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

    // 預先載入所有學年設定，避免下方逐一學生解析時每次都查詢資料庫。
    const academicYears = await this.academicService.buildAcademicYearLookup();

    for (const student of students) {
      // 以報表區間的結束日期解析學生對應的班級註冊紀錄，
      // 取代原本「直接取第一筆」的假設（一位學生可能有多筆跨學年的註冊紀錄）。
      const enrollment = await this.academicService.resolveEnrollment(
        student,
        new Date(endDate),
        academicYears,
      );
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
    const where: Prisma.AttendanceRecordWhereInput = {
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
    const totalStudentsQuery: Prisma.StudentClassEnrollmentWhereInput = {};
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
      const season = await this.prisma.$queryRaw<SeasonDateRangeRow[]>`
        SELECT start_date, end_date FROM seasons WHERE id = ${queryDto.seasonId}
      `;

      if (Array.isArray(season) && season.length > 0) {
        const seasonData = season[0];
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