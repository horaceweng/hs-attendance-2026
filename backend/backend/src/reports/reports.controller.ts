// in src/reports/reports.controller.ts --- 更新後版本

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService, ReportRow } from './reports.service';
import { AuthGuard } from '@nestjs/passport';
import { GetAttendanceReportDto } from './dto/get-report.dto';
import { GetPendingLeavesDto } from './dto/get-pending-leaves.dto';
import { GetUnresolvedAbsencesDto } from './dto/get-unresolved-absences.dto'; // <-- 導入新的 DTO


@UseGuards(AuthGuard('jwt'))
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // 【新增】處理曠缺待處理報表的端點
  @Get('unresolved-absences')
  getUnresolvedAbsencesReport(@Query() queryDto: GetUnresolvedAbsencesDto) { // <-- 使用新的 DTO
    console.log('後端 Controller 收到的 attendance DTO:', queryDto);
    return this.reportsService.getUnresolvedAbsencesReport(queryDto);
  }

  @Get('pending-leaves')
  getPendingLeavesReport(@Query() queryDto: GetPendingLeavesDto) {
    console.log('後端 Controller 收到的 attendance DTO:', queryDto);
    return this.reportsService.getPendingLeavesReport(queryDto);
  }

  @Get('attendance')
  getAttendanceReport(@Query() queryDto: GetAttendanceReportDto): Promise<ReportRow[]> {
    console.log('後端 Controller 收到的 attendance DTO:', queryDto);
    return this.reportsService.getAttendanceReport(queryDto);
  }

  
}