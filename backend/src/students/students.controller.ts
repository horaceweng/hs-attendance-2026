// in src/students/students.controller.ts
import { ClassAccessGuard } from 'src/auth/guards/class-access/class-access.guard'; 
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  ParseIntPipe, 
  UseGuards, 
  Query 
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('students')
export class StudentsController {
    constructor(private readonly studentsService: StudentsService) {}

    @UseGuards(AuthGuard('jwt'), ClassAccessGuard)
    @Get('class/:classId')
    findAllByClass(@Param('classId', ParseIntPipe) classId: number) {
        return this.studentsService.findAllByClass(classId);
    }
    
    // Admin endpoints for student management
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Get()
    @Roles(Role.GA_specialist)
    findAll(
        @Query('status') status?: string,
        @Query('includeEnrollments') includeEnrollments?: boolean
    ) {
        return this.studentsService.findAll(status, includeEnrollments);
    }
    
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Get(':id')
    @Roles(Role.GA_specialist)
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.studentsService.findOne(id);
    }
    
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Post()
    @Roles(Role.GA_specialist)
    create(@Body() data: any) {
        return this.studentsService.create(data);
    }
    
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Put(':id')
    @Roles(Role.GA_specialist)
    update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
        return this.studentsService.update(id, data);
    }
    
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Delete(':id')
    @Roles(Role.GA_specialist)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.studentsService.remove(id);
    }
    
    // 學生班級註冊相關端點
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Get(':id/enrollments')
    @Roles(Role.GA_specialist)
    getStudentEnrollments(@Param('id', ParseIntPipe) id: number) {
        return this.studentsService.getStudentEnrollments(id);
    }
    
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Post('/enrollments')
    @Roles(Role.GA_specialist)
    createStudentEnrollment(@Body() data: any) {
        return this.studentsService.createStudentEnrollment(data);
    }
    
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Put('/enrollments/:id')
    @Roles(Role.GA_specialist)
    updateStudentEnrollment(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: any
    ) {
        return this.studentsService.updateStudentEnrollment(id, data);
    }
    
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Delete('/enrollments/:id')
    @Roles(Role.GA_specialist)
    removeStudentEnrollment(@Param('id', ParseIntPipe) id: number) {
        return this.studentsService.removeStudentEnrollment(id);
    }
}