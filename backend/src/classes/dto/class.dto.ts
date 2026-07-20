// in src/classes/dto/class.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// 新增班級
export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

// 更新班級
export class UpdateClassDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
