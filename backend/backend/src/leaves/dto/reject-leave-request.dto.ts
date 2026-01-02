import { IsString, IsOptional } from 'class-validator';

export class RejectLeaveRequestDto {
    @IsString()
    @IsOptional()
    reason?: string;
}