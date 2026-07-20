import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('classes')
export class ClassesController {
    constructor(private readonly classesService: ClassesService) {}

    @Get()
    findAll(@Request() req) {
        return this.classesService.findAll(req.user);
    }

    @Post()
    @Roles(Role.GA_specialist)
    create(@Body() data: CreateClassDto, @Request() req) {
        return this.classesService.create(data, req.user);
    }

    @Put(':id')
    @Roles(Role.GA_specialist)
    update(@Param('id') id: string, @Body() data: UpdateClassDto, @Request() req) {
        return this.classesService.update(+id, data, req.user);
    }

    @Delete(':id')
    @Roles(Role.GA_specialist)
    remove(@Param('id') id: string, @Request() req) {
        return this.classesService.remove(+id, req.user);
    }

    @Get(':id/teachers')
    getClassTeachers(@Param('id') id: string, @Request() req) {
        return this.classesService.getClassTeachers(+id, req.user);
    }

    @Post('assign-teacher')
    @Roles(Role.GA_specialist)
    assignTeacher(@Body() data: AssignTeacherDto, @Request() req) {
        return this.classesService.assignTeacher(data, req.user);
    }
}