// in src/attendance/dto/submit-attendance.dto.ts
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';

enum AttendanceStatus {
    PRESENT = 'present',
    ABSENT = 'absent',
    LATE = 'late',
    LEAVE_EARLY = 'leave_early',
}
class StudentAttendanceRecordDto {
    @IsInt()
    studentId: number;

    @IsEnum(AttendanceStatus)
    status: AttendanceStatus;

    @IsString()
    @IsOptional()
    note?: string;
}
export class SubmitClassAttendanceDto {
    @IsDateString()
    attendanceDate: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StudentAttendanceRecordDto)
    records: StudentAttendanceRecordDto[];
}