// in src/users/dto/create-user.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

// 新增使用者（老師 / 行政人員）共用的請求資料
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
