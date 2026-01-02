// in src/statistics/statistics.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StatisticsService } from './statistics.service';
import { GetStatisticsReportDto } from './dto/get-statistics.dto';
import { GetAttendanceStatsDto } from './dto/attendance-stats.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('report')
  async getStatisticsReport(@Query() queryDto: GetStatisticsReportDto) {
    return this.statisticsService.getStatisticsReport(queryDto);
  }
  
  @Get('attendance')
  async getAttendanceStatistics(@Query() queryDto: GetAttendanceStatsDto) {
    return this.statisticsService.getAttendanceStatistics(queryDto);
  }

  @Get('attendance/by-class')
  async getAttendanceStatisticsByClass(@Query() queryDto: GetAttendanceStatsDto) {
    return this.statisticsService.getAttendanceStatisticsByClass(queryDto);
  }

  @Get('attendance/by-student')
  async getAttendanceStatisticsByStudent(@Query() queryDto: GetAttendanceStatsDto) {
    return this.statisticsService.getAttendanceStatisticsByStudent(queryDto);
  }

  @Get('attendance/by-date')
  async getAttendanceStatisticsByDate(@Query() queryDto: GetAttendanceStatsDto) {
    return this.statisticsService.getAttendanceStatisticsByDate(queryDto);
  }
}