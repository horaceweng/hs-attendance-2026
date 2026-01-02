import { Controller, Post, Body, UseGuards, Request, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { RejectLeaveRequestDto } from './dto/reject-leave-request.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/auth/roles.guard';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post()
  create(@Request() req, @Body() createLeaveDto: CreateLeaveRequestDto) {
    const creatorId = req.user.userId; // 從 JWT 取得操作者 ID
    return this.leavesService.create(creatorId, createLeaveDto);
  }

  @Patch(':id/approve')
  @Roles(Role.GA_specialist)
  approve(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const approverId = req.user.userId;
    return this.leavesService.approve(id, approverId);
  }

  @Patch(':id/reject')
  @Roles(Role.GA_specialist)
  reject(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() rejectLeaveDto: RejectLeaveRequestDto,
  ) {
    const approverId = req.user.userId;
    return this.leavesService.reject(id, approverId, rejectLeaveDto.reason);
  }
}