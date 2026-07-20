// in src/leave-types/dto/leave-type.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// 新增假別
export class CreateLeaveTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

// 更新假別
export class UpdateLeaveTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
