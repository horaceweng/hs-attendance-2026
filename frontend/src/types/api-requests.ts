// src/types/api-requests.ts
// 對應後端各 API 端點實際接受的請求資料型別，取代原本 api.ts 中的 `data: any`。

// --- 請假申請 ---
export interface CreateLeaveRequestPayload {
  studentId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  isFullDay: boolean;
  reason: string;
}

// --- 每日出缺勤登記 ---
export interface AttendanceRecordInput {
  studentId: number;
  status: string;
}

export interface SubmitAttendancePayload {
  attendanceDate: string;
  records: AttendanceRecordInput[];
}

// --- 出缺勤報表查詢參數 ---
export interface AttendanceReportParams {
  startDate?: string;
  endDate?: string;
  grades?: string[];
  statuses?: string[];
}

export interface PendingLeavesReportParams {
  ageFilter?: 'within_3_days' | 'over_3_days';
  grades?: string[];
}

export interface UnresolvedAbsencesReportParams {
  grades?: string[];
}

// --- 出缺勤統計報表查詢參數 ---
export interface StatisticsReportParams {
  academicYear?: string;
  term?: string;
  semester?: string;
  grades?: string[];
  studentId?: number;
}

// --- 班級管理 ---
export interface CreateClassPayload {
  name: string;
  description?: string;
}

export interface UpdateClassPayload {
  name?: string;
  description?: string;
}

export interface AssignTeacherPayload {
  classId: number;
  teacherId: number | string;
  schoolYear: string;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
  notes?: string | null;
}

// --- 假別管理 ---
export interface CreateLeaveTypePayload {
  name: string;
  description?: string;
}

export interface UpdateLeaveTypePayload {
  name?: string;
  description?: string;
}

// --- 人員管理（老師 / 行政人員）---
export interface CreateUserPayload {
  name: string;
}

// --- 學年管理 ---
export interface CreateAcademicYearPayload {
  year: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  autoPromoteStudents?: boolean;
}

export type UpdateAcademicYearPayload = Omit<CreateAcademicYearPayload, 'autoPromoteStudents'>;

// --- 學季管理 ---
export type SeasonType = 'fall' | 'winter' | 'spring' | 'summer';

export interface CreateSeasonPayload {
  name: string;
  type: SeasonType;
  startDate: string;
  endDate: string;
  academicYearId: number;
  isActive?: boolean;
}

export type UpdateSeasonPayload = CreateSeasonPayload;

// --- 假日管理 ---
export interface CreateHolidayPayload {
  date: string;
  description: string;
  seasonId: number;
}

// --- 學生管理 ---
export type Gender = 'male' | 'female' | 'other';
export type StudentStatus = 'active' | 'transferred_out' | 'graduated' | 'suspended';

export interface GetStudentsParams {
  status?: string;
  includeEnrollments?: boolean;
}

export interface CreateStudentPayload {
  studentId: string;
  name: string;
  birthday: string;
  gender: Gender;
  status: StudentStatus;
  enrollmentDate: string;
  departureDate?: string | null;
  departureReason?: string | null;
  // 表單元件會多帶一個 classId 欄位供前端使用，後端 DTO 未宣告此欄位、會被 ValidationPipe 忽略
  classId?: string | number;
}

export type UpdateStudentPayload = CreateStudentPayload;

export interface CreateStudentEnrollmentPayload {
  studentId: number;
  classId: number | string;
  schoolYear: number;
}

export interface UpdateStudentEnrollmentPayload {
  classId: number;
  schoolYear: number;
}
