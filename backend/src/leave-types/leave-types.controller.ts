// in src/leave-types/leave-types.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { LeaveTypesService } from './leave-types.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto } from './dto/leave-type.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard) // 保護此路由，需要登入才能存取；寫入端點另限管理員角色
@Controller('leave-types')  // 設定此 Controller 的基礎路徑為 /leave-types
export class LeaveTypesController {
  constructor(private readonly leaveTypesService: LeaveTypesService) {}

  @Get() // 對應到 GET /leave-types 請求
  findAll() {
    return this.leaveTypesService.findAll();
  }

  @Post()
  @Roles(Role.GA_specialist)
  create(@Body() data: CreateLeaveTypeDto) {
    return this.leaveTypesService.create(data);
  }

  @Put(':id')
  @Roles(Role.GA_specialist)
  update(@Param('id') id: string, @Body() data: UpdateLeaveTypeDto) {
    return this.leaveTypesService.update(+id, data);
  }

  @Delete(':id')
  @Roles(Role.GA_specialist)
  remove(@Param('id') id: string) {
    return this.leaveTypesService.remove(+id);
  }
}