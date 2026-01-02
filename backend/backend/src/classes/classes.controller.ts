// in src/classes/classes.controller.ts --- UPDATED
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('classes')
export class ClassesController {
    constructor(private readonly classesService: ClassesService) {}

    @Get()
    findAll(@Request() req) {
        console.log('[ClassesController] Handling GET /classes request.');
        return this.classesService.findAll(req.user);
    }
    
    @Post()
    create(@Body() data: { name: string; description?: string }, @Request() req) {
        return this.classesService.create(data, req.user);
    }
    
    @Put(':id')
    update(@Param('id') id: string, @Body() data: { name?: string; description?: string }, @Request() req) {
        return this.classesService.update(+id, data, req.user);
    }
    
    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.classesService.remove(+id, req.user);
    }
    
    @Get(':id/teachers')
    getClassTeachers(@Param('id') id: string, @Request() req) {
        console.log(`[ClassesController] Getting teachers for class ${id}`);
        return this.classesService.getClassTeachers(+id, req.user);
    }
    
    @Post('assign-teacher')
    assignTeacher(@Body() data: {
        classId: number;
        teacherId: number;
        schoolYear: string;
        startDate?: string;
        endDate?: string;
        isActive?: boolean;
        notes?: string;
    }, @Request() req) {
        console.log('[ClassesController] Assigning teacher to class', data);
        return this.classesService.assignTeacher(data, req.user);
    }
}