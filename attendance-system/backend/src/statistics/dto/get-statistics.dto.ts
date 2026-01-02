// in src/statistics/dto/get-statistics.dto.ts
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsArray, IsInt } from 'class-validator';

export class GetStatisticsReportDto {
  @IsOptional()
  @IsString()
  academicYear?: string;
  
  @IsOptional()
  @IsString()
  term?: string; // 'first' or 'second'
  
  @IsOptional()
  @IsString()
  semester?: string; // 'fall', 'winter', 'spring', 'summer'
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  grades?: string[]; // e.g., ['10', '11']
  
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  studentId?: number;
}