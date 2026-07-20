import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService, ReportRow } from './reports.service';
import { AuthGuard } from '@nestjs/passport';
import { GetAttendanceReportDto } from './dto/get-report.dto';
import { GetPendingLeavesDto } from './dto/get-pending-leaves.dto';
import { GetUnresolvedAbsencesDto } from './dto/get-unresolved-absences.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('unresolved-absences')
  getUnresolvedAbsencesReport(@Query() queryDto: GetUnresolvedAbsencesDto) {
    return this.reportsService.getUnresolvedAbsencesReport(queryDto);
  }

  @Get('pending-leaves')
  getPendingLeavesReport(@Query() queryDto: GetPendingLeavesDto) {
    return this.reportsService.getPendingLeavesReport(queryDto);
  }

  @Get('attendance')
  getAttendanceReport(@Query() queryDto: GetAttendanceReportDto): Promise<ReportRow[]> {
    return this.reportsService.getAttendanceReport(queryDto);
  }
}