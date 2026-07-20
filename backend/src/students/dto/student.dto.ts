// in src/students/dto/student.dto.ts
import { Gender, StudentStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// 新增學生資料
export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  birthday: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsEnum(StudentStatus)
  status: StudentStatus;

  @IsDateString()
  @IsNotEmpty()
  enrollmentDate: string;

  @IsOptional()
  @IsDateString()
  departureDate?: string;

  @IsOptional()
  @IsString()
  departureReason?: string;
}

// 更新學生資料（與新增所需欄位一致，僅缺少 studentId，因為學號不可修改）
export class UpdateStudentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  birthday: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsEnum(StudentStatus)
  status: StudentStatus;

  @IsDateString()
  @IsNotEmpty()
  enrollmentDate: string;

  @IsOptional()
  @IsDateString()
  departureDate?: string;

  @IsOptional()
  @IsString()
  departureReason?: string;
}
