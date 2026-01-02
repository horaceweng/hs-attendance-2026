// 請用此版本完整替換 backend/src/attendance/attendance.controller.ts

import { Controller, Get, Post, Body, Param, ParseIntPipe, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AttendanceService } from './attendance.service';
import { SubmitClassAttendanceDto } from './dto/submit-attendance.dto';
import { ClassAccessGuard } from 'src/auth/guards/class-access/class-access.guard';

@UseGuards(AuthGuard('jwt'), ClassAccessGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('class/:classId')
  getAttendanceForClass(
    @Param('classId', ParseIntPipe) classId: number,
    @Query('date') dateString: string,
  ) {
    console.log(`[AttendanceController] Handling GET /attendance/class/${classId}`); // <-- 加入偵錯日誌
    const date = dateString ? new Date(dateString) : new Date();
    return this.attendanceService.getAttendanceForClass(classId, date);
  }

  @Post('class/:classId')
  recordClassAttendance(
      @Request() req,
      @Param('classId', ParseIntPipe) classId: number,
      @Body() submitDto: SubmitClassAttendanceDto
  ) {
      console.log(`[AttendanceController] Handling POST /attendance/class/${classId}`); // <-- 加入偵錯日誌
      const creatorId = req.user.userId;
      return this.attendanceService.recordClassAttendance(classId, creatorId, submitDto);
  }
}