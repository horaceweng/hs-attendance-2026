// src/statistics/dto/attendance-stats.interface.ts
export interface AttendanceStatistics {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveEarlyDays: number;
  onLeaveDays: number;
  attendanceRate: number; // Percentage of days present out of total days
}

export interface ClassAttendanceStatistics extends AttendanceStatistics {
  classId: number;
  className: string;
  gradeId: number;
  gradeName: string;
}

export interface StudentAttendanceStatistics extends AttendanceStatistics {
  studentId: number;
  studentName: string;
  classId: number;
  className: string;
}

export interface DateAttendanceStatistics {
  date: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  leaveEarlyCount: number;
  onLeaveCount: number;
  attendanceRate: number;
}