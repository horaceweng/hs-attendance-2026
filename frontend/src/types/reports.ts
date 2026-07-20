// src/types/reports.ts
// 各報表頁面使用的資料列型別，對應後端各報表 API 實際回傳的欄位。

// 出缺勤總表 - 對應 backend ReportsService.getAttendanceReport 的 ReportRow
export interface AttendanceReportRow {
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

// 待審核假單報表 - 對應 backend ReportsService.getPendingLeavesReport
// （回傳原始 Prisma LeaveRequest，並 include student / leaveType）
export interface PendingLeaveReportRow {
  id: number;
  createdAt: string;
  startDate: string;
  endDate: string;
  student: { name: string };
  leaveType: { name: string };
}

// 曠缺待處理報表 - 對應 backend ReportsService.getUnresolvedAbsencesReport
// （回傳原始 Prisma AttendanceRecord，並 include student / class）
export interface UnresolvedAbsenceReportRow {
  id: number;
  attendanceDate: string;
  class: { name: string };
  student: { name: string };
}

// 出缺勤總表列的聯集型別（依報表類型而定，畫面渲染時再各自轉型）
export type AttendanceOverviewReportRow =
  | AttendanceReportRow
  | PendingLeaveReportRow
  | UnresolvedAbsenceReportRow;

// 出缺勤統計報表 - 對應 backend StatisticsService.getStatisticsReport 的 StatisticsReportRow
export interface LeaveTypeCount {
  approved: { days: number; hours: number };
  pending: { days: number; hours: number };
  rejected: { days: number; hours: number };
  total: { days: number; hours: number };
}

export interface StatisticsReportRow {
  studentId: number;
  studentName: string;
  grade: string;
  className: string;
  leaveTypeCounts: { [type: string]: LeaveTypeCount };
  lateDays: number;
  leaveEarlyDays: number;
  absentDays: number;
  totalDays: number;
}
