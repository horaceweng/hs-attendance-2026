// in src/students/dto/student-enrollment.dto.ts
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

// 建立學生班級註冊
export class CreateStudentEnrollmentDto {
  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  studentId: number;

  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  classId: number;

  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  schoolYear: number;
}

// 更新學生班級註冊
export class UpdateStudentEnrollmentDto {
  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  classId: number;

  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  schoolYear: number;
}
