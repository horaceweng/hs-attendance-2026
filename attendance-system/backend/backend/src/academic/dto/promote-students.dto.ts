import { IsBoolean, IsInt, IsOptional } from 'class-validator';

export class PromoteStudentsDto {
  @IsInt()
  year: number;

  @IsBoolean()
  @IsOptional()
  autoPromoteStudents?: boolean = false;
}