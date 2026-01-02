// src/academic/dto/holiday.dto.ts
import { IsNotEmpty, IsString, IsDateString, IsNumber } from 'class-validator';

export class CreateHolidayDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  seasonId: number;
}

export class UpdateHolidayDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  seasonId: number;
}