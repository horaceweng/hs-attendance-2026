// src/statistics/dto/attendance-stats.dto.ts
import { IsOptional, IsString, IsNumber, IsDateString, IsArray } from 'class-validator';

export class GetAttendanceStatsDto {
  @IsOptional()
  @IsNumber()
  classId?: number;

  @IsOptional()
  @IsNumber()
  studentId?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  seasonId?: number;
}

export class AttendanceStatisticsResponseDto {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveEarlyDays: number;
  onLeaveDays: number;
  attendanceRate: number;
  
  @IsOptional()
  @IsArray()
  details?: any[];
}