import { Controller, Get, Post, Delete, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

// 使用者管理僅限管理員（GA_specialist）存取，避免一般教師建立/刪除帳號造成提權
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('teachers')
    @Roles(Role.GA_specialist)
    async getTeachers() {
        return this.usersService.findAllTeachers();
    }

    @Get('ga-specialists')
    @Roles(Role.GA_specialist)
    async getGASpecialists() {
        return this.usersService.findAllGASpecialists();
    }

    @Post('teacher')
    @Roles(Role.GA_specialist)
    async createTeacher(@Body() data: { name: string }) {
        try {
            return await this.usersService.createUser({
                name: data.name,
                role: Role.teacher
            });
        } catch (error) {
            throw new HttpException(
                'Failed to create teacher: ' + error.message,
                HttpStatus.BAD_REQUEST
            );
        }
    }
    
    @Post('ga-specialist')
    @Roles(Role.GA_specialist)
    async createGASpecialist(@Body() data: { name: string }) {
        try {
            return await this.usersService.createUser({
                name: data.name,
                role: Role.GA_specialist
            });
        } catch (error) {
            throw new HttpException(
                'Failed to create GA specialist: ' + error.message,
                HttpStatus.BAD_REQUEST
            );
        }
    }
    
    @Delete(':id')
    @Roles(Role.GA_specialist)
    async deleteUser(@Param('id') id: string) {
        try {
            return await this.usersService.deleteUser(+id);
        } catch (error) {
            if (error.message.includes('Cannot delete user')) {
                throw new HttpException(
                    error.message,
                    HttpStatus.CONFLICT
                );
            }
            throw new HttpException(
                'Failed to delete user: ' + error.message,
                HttpStatus.BAD_REQUEST
            );
        }
    }
}