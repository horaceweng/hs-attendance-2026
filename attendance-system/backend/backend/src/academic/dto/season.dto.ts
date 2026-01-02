// src/academic/dto/season.dto.ts
import { IsNotEmpty, IsString, IsBoolean, IsDateString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { SeasonType } from '../../prisma/prisma-schema';

export class CreateSeasonDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(SeasonType)
  @IsNotEmpty()
  type: SeasonType;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string') return parseInt(value, 10);
    return value;
  })
  academicYearId: number;

  @IsBoolean({ message: 'isActive must be a boolean value' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value === undefined ? true : value;
  })
  isActive: boolean = true;
}

export class UpdateSeasonDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(SeasonType)
  @IsNotEmpty()
  type: SeasonType;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string') return parseInt(value, 10);
    return value;
  })
  academicYearId: number;

  @IsBoolean({ message: 'isActive must be a boolean value' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;
}