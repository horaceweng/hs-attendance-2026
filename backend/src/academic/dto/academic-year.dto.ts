// src/academic/dto/academic-year.dto.ts
import { IsNotEmpty, IsString, IsBoolean, IsDateString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAcademicYearDto {
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string') return parseInt(value, 10);
    return value;
  })
  year: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsBoolean({ message: 'isActive must be a boolean value' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive: boolean;
}

export class UpdateAcademicYearDto {
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string') return parseInt(value, 10);
    return value;
  })
  year: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsBoolean({ message: 'isActive must be a boolean value' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive: boolean;
}