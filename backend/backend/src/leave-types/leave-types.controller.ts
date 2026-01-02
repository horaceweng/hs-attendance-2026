// in src/leave-types/leave-types.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { LeaveTypesService } from './leave-types.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt')) // 保護此路由，需要登入才能存取
@Controller('leave-types')  // 設定此 Controller 的基礎路徑為 /leave-types
export class LeaveTypesController {
  constructor(private readonly leaveTypesService: LeaveTypesService) {}

  @Get() // 對應到 GET /leave-types 請求
  findAll() {
    return this.leaveTypesService.findAll();
  }
  
  @Post()
  create(@Body() data: { name: string; description?: string }) {
    return this.leaveTypesService.create(data);
  }
  
  @Put(':id')
  update(@Param('id') id: string, @Body() data: { name?: string; description?: string }) {
    return this.leaveTypesService.update(+id, data);
  }
  
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leaveTypesService.remove(+id);
  }
}