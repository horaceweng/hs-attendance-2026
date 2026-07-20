// in src/classes/dto/assign-teacher.dto.ts
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// 指派導師到班級
export class AssignTeacherDto {
  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  classId: number;

  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  teacherId: number;

  @IsString()
  @IsNotEmpty()
  schoolYear: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
