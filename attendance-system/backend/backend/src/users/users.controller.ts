import { Controller, Get, Post, Delete, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('teachers')
    async getTeachers() {
        console.log('[UsersController] Getting all teachers');
        return this.usersService.findAllTeachers();
    }
    
    @Get('ga-specialists')
    async getGASpecialists() {
        console.log('[UsersController] Getting all GA specialists');
        return this.usersService.findAllGASpecialists();
    }
    
    @Post('teacher')
    async createTeacher(@Body() data: { name: string }) {
        console.log('[UsersController] Creating new teacher:', data);
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
    async createGASpecialist(@Body() data: { name: string }) {
        console.log('[UsersController] Creating new GA specialist:', data);
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
    async deleteUser(@Param('id') id: string) {
        console.log('[UsersController] Deleting user with ID:', id);
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