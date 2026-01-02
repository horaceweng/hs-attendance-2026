// in src/leaves/dto/create-leave-request.dto.ts
import { IsInt, IsDateString, IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateLeaveRequestDto {
    @IsInt()
    @IsNotEmpty()
    studentId: number;

    @IsInt()
    @IsNotEmpty()
    leaveTypeId: number;

    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @IsDateString()
    @IsNotEmpty()
    endDate: string;

    @IsString()
    @IsOptional()
    startTime?: string;
    
    @IsString()
    @IsOptional()
    endTime?: string;

    @IsBoolean()
    @IsOptional()
    isFullDay?: boolean = true;

    @IsString()
    @IsOptional()
    reason?: string;
}