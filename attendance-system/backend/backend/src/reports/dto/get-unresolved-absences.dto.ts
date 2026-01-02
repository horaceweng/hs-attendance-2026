// in src/reports/dto/get-unresolved-absences.dto.ts
import { Transform } from 'class-transformer';
import { IsOptional, IsArray, IsString } from 'class-validator';

export class GetUnresolvedAbsencesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  grades?: string[];
}