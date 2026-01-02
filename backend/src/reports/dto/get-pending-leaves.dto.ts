// in src/reports/dto/get-pending-leaves.dto.ts
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsArray, IsString } from 'class-validator';

export class GetPendingLeavesDto {
  @IsOptional()
  @IsIn(['within_3_days', 'over_3_days'])
  ageFilter?: 'within_3_days' | 'over_3_days';

  // 【新增】
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  grades?: string[];
}