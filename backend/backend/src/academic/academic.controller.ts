// src/academic/academic.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards,
  Query,
  ParseIntPipe,
  All
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AcademicService } from './academic.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  CreateSeasonDto,
  UpdateSeasonDto,
  CreateHolidayDto,
  PromoteStudentsDto
} from './dto';

@Controller()
@UseGuards(AuthGuard('jwt')) // 暫時移除 RolesGuard 以測試基本身份驗證
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  // Academic Years Controller - Primary endpoints
  @Get('academic/years')
  findAllAcademicYears() {
    return this.academicService.findAllAcademicYears();
  }
  
  @Get('academic/years/:id')
  findOneAcademicYear(@Param('id', ParseIntPipe) id: number) {
    return this.academicService.findOneAcademicYear(id);
  }

  @Post('academic/years')
  // 暫時移除角色限制
  // @Roles(Role.GA_specialist)
  createAcademicYear(@Body() data: CreateAcademicYearDto) {
    // Ensure isActive is a boolean
    if (data.isActive === undefined) {
      data.isActive = true; // Default value
    } else if (typeof data.isActive === 'string') {
      data.isActive = data.isActive === 'true';
    }
    
    // 檢查是否要自動升級學生
    const autoPromoteStudents = data['autoPromoteStudents'] === true;
    delete data['autoPromoteStudents']; // 從DTO中刪除非標準欄位
    
    return this.academicService.createAcademicYear(data, autoPromoteStudents);
  }

  @Put('academic/years/:id')
  @Roles(Role.GA_specialist)
  updateAcademicYear(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateAcademicYearDto) {
    // Ensure isActive is a boolean
    if (data.isActive !== undefined && typeof data.isActive === 'string') {
      data.isActive = data.isActive === 'true';
    }
    return this.academicService.updateAcademicYear(id, data);
  }

  @Delete('academic/years/:id')
  @Roles(Role.GA_specialist)
  removeAcademicYear(@Param('id', ParseIntPipe) id: number) {
    return this.academicService.removeAcademicYear(id);
  }
  
  // Legacy compatibility routes
  @Get('academic-years')
  legacyFindAllAcademicYears() {
    return this.academicService.findAllAcademicYears();
  }
  
  @Get('academic-years/:id')
  legacyFindOneAcademicYear(@Param('id', ParseIntPipe) id: number) {
    return this.academicService.findOneAcademicYear(id);
  }

  @Post('academic-years')
  // 暫時移除角色限制
  // @Roles(Role.GA_specialist)
  legacyCreateAcademicYear(@Body() data: CreateAcademicYearDto) {
    // Ensure isActive is a boolean
    if (data.isActive === undefined) {
      data.isActive = true; // Default value
    } else if (typeof data.isActive === 'string') {
      data.isActive = data.isActive === 'true';
    }
    
    // 檢查是否要自動升級學生
    const autoPromoteStudents = data['autoPromoteStudents'] === true;
    delete data['autoPromoteStudents']; // 從DTO中刪除非標準欄位
    
    return this.academicService.createAcademicYear(data, autoPromoteStudents);
  }

  @Put('academic-years/:id')
  @Roles(Role.GA_specialist)
  legacyUpdateAcademicYear(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateAcademicYearDto) {
    // Ensure isActive is a boolean
    if (data.isActive !== undefined && typeof data.isActive === 'string') {
      data.isActive = data.isActive === 'true';
    }
    return this.academicService.updateAcademicYear(id, data);
  }

  @Delete('academic-years/:id')
  @Roles(Role.GA_specialist)
  legacyRemoveAcademicYear(@Param('id', ParseIntPipe) id: number) {
    return this.academicService.removeAcademicYear(id);
  }

  // Seasons Controller - Primary endpoints
  @Get('academic/seasons')
  findAllSeasons(@Query('academicYearId') academicYearId?: string) {
    return this.academicService.findAllSeasons(academicYearId ? +academicYearId : undefined);
  }
  
  @Get('academic/seasons/:id')
  findOneSeason(@Param('id', ParseIntPipe) id: number) {
    return this.academicService.findOneSeason(id);
  }

  @Post('academic/seasons')
  @Roles(Role.GA_specialist)
  createSeason(@Body() data: CreateSeasonDto) {
    // Ensure isActive is a boolean
    if (data.isActive === undefined) {
      data.isActive = true; // Default value
    } else if (typeof data.isActive === 'string') {
      data.isActive = data.isActive === 'true';
    }
    return this.academicService.createSeason(data);
  }

  @Put('academic/seasons/:id')
  @Roles(Role.GA_specialist)
  updateSeason(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateSeasonDto) {
    // Ensure isActive is a boolean
    if (data.isActive !== undefined && typeof data.isActive === 'string') {
      data.isActive = data.isActive === 'true';
    }
    return this.academicService.updateSeason(id, data);
  }

  @Delete('academic/seasons/:id')
  @Roles(Role.GA_specialist)
  removeSeason(@Param('id', ParseIntPipe) id: number) {
    return this.academicService.removeSeason(id);
  }
  
  // Legacy compatibility routes for seasons
  @Get('seasons')
  legacyFindAllSeasons(@Query('academicYearId') academicYearId?: string) {
    return this.academicService.findAllSeasons(academicYearId ? +academicYearId : undefined);
  }
  
  @Get('seasons/:id')
  legacyFindOneSeason(@Param('id', ParseIntPipe) id: number) {
    return this.academicService.findOneSeason(id);
  }

  @Post('seasons')
  @Roles(Role.GA_specialist)
  legacyCreateSeason(@Body() data: CreateSeasonDto) {
    // Ensure isActive is a boolean
    if (data.isActive === undefined) {
      data.isActive = true; // Default value
    } else if (typeof data.isActive === 'string') {
      data.isActive = data.isActive === 'true';
    }
    return this.academicService.createSeason(data);
  }

  @Put('seasons/:id')
  @Roles(Role.GA_specialist)
  legacyUpdateSeason(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateSeasonDto) {
    // Ensure isActive is a boolean
    if (data.isActive !== undefined && typeof data.isActive === 'string') {
      data.isActive = data.isActive === 'true';
    }
    return this.academicService.updateSeason(id, data);
  }

  @Delete('seasons/:id')
  @Roles(Role.GA_specialist)
  legacyRemoveSeason(@Param('id', ParseIntPipe) id: number) {
    return this.academicService.removeSeason(id);
  }

  // Holidays Controller - Primary endpoints
  @Get('academic/holidays')
  findAllHolidays(@Query('seasonId') seasonId?: string) {
    return this.academicService.findAllHolidays(seasonId ? +seasonId : undefined);
  }
  
  @Get('academic/holidays/:id')
  findOneHoliday(@Param('id', ParseIntPipe) id: number) {
    return this.academicService.findOneHoliday(id);
  }

  @Post('academic/holidays')
  @Roles(Role.GA_specialist)
  createHoliday(@Body() data: CreateHolidayDto) {
    return this.academicService.createHoliday(data);
  }

  @Delete('academic/holidays/:id')
  @Roles(Role.GA_specialist)
  removeHoliday(@Param('id', ParseIntPipe) id: number) {
    return this.academicService.removeHoliday(id);
  }
  
  // Legacy compatibility routes for holidays
  @Get('holidays')
  legacyFindAllHolidays(@Query('seasonId') seasonId?: string) {
    return this.academicService.findAllHolidays(seasonId ? +seasonId : undefined);
  }
  
  @Get('holidays/:id')
  legacyFindOneHoliday(@Param('id', ParseIntPipe) id: number) {
    return this.academicService.findOneHoliday(id);
  }

  @Post('holidays')
  @Roles(Role.GA_specialist)
  legacyCreateHoliday(@Body() data: CreateHolidayDto) {
    return this.academicService.createHoliday(data);
  }

  @Delete('holidays/:id')
  @Roles(Role.GA_specialist)
  legacyRemoveHoliday(@Param('id', ParseIntPipe) id: number) {
    return this.academicService.removeHoliday(id);
  }
  
  // 學生升級相關功能 - 使用學年 ID
  @Post('academic/years/:id/promote')
  @Roles(Role.GA_specialist)
  async promoteStudentsForYear(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await this.academicService.promoteStudents(id);
      return {
        success: true,
        message: `成功將 ${result.promoted} 名學生升級至下一年級，${result.graduated} 名學生畢業`,
        ...result
      };
    } catch (error) {
      console.error('學生升級失敗:', error);
      return {
        success: false,
        message: `學生升級失敗: ${error.message}`,
        error: error.message
      };
    }
  }
  
  // 學生升級相關功能 - 使用學年年度
  @Post('academic/years/by-year/:year/promote')
  @Roles(Role.GA_specialist)
  async promoteStudentsByYear(@Param('year', ParseIntPipe) year: number) {
    try {
      // 先通過年度查找學年 ID
      const id = await this.academicService.findAcademicYearByYear(year);
      // 再用學年 ID 進行升級操作
      const result = await this.academicService.promoteStudents(id);
      return {
        success: true,
        message: `成功將 ${result.promoted} 名學生從 ${year} 學年升級至下一年級，${result.graduated} 名學生畢業`,
        ...result
      };
    } catch (error) {
      console.error(`${year} 學年學生升級失敗:`, error);
      return {
        success: false,
        message: `${year} 學年學生升級失敗: ${error.message}`,
        error: error.message
      };
    }
  }
  
  // 學生升級相關功能 - Legacy routes
  @Post('academic-years/:id/promote')
  @Roles(Role.GA_specialist)
  legacyPromoteStudentsForYear(@Param('id', ParseIntPipe) id: number) {
    return this.promoteStudentsForYear(id);
  }
  
  @Post('academic-years/by-year/:year/promote')
  @Roles(Role.GA_specialist)
  legacyPromoteStudentsByYear(@Param('year', ParseIntPipe) year: number) {
    return this.promoteStudentsByYear(year);
  }
}