// in src/reports/dto/get-report.dto.ts
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsArray, IsDateString } from 'class-validator';

export class GetAttendanceReportDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  grades?: string[]; // e.g., ['10', '11']

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  statuses?: string[]; // e.g., ['late', 'absent']
}