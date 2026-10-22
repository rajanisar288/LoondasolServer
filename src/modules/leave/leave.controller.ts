import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { ApplyLeaveDto, ReviewLeaveDto } from './dto/leave.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import {
  CurrentTenant,
  TenantContext,
} from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Leave, LeaveStatus } from './schemas/leave.schema';
import { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Leave Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post('apply')
  @RequirePermissions(PERMISSIONS.LEAVE_CREATE)
  @ApiOperation({ summary: 'Submit a new leave application' })
  async apply(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ApplyLeaveDto,
  ): Promise<Leave> {
    return this.leaveService.apply(tenant, user, dto);
  }

  @Get('my')
  @RequirePermissions(PERMISSIONS.LEAVE_VIEW)
  @ApiOperation({ summary: "Get current user's submitted leave applications" })
  async findMyLeaves(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
  ): Promise<Leave[]> {
    return this.leaveService.findMyLeaves(tenant, user);
  }

  @Get('balances')
  @RequirePermissions(PERMISSIONS.LEAVE_VIEW)
  @ApiOperation({ summary: "Get current user's leave balances & type breakdown" })
  async getBalances(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leaveService.getBalances(tenant, user);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.LEAVE_VIEW)
  @ApiOperation({ summary: 'List all company leave requests' })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query('status') status?: LeaveStatus,
  ): Promise<Leave[]> {
    return this.leaveService.findAll(tenant, status);
  }

  @Patch(':id/approve')
  @RequirePermissions(PERMISSIONS.LEAVE_APPROVE)
  @ApiOperation({ summary: 'Approve a pending leave application' })
  async approve(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReviewLeaveDto,
  ): Promise<Leave> {
    return this.leaveService.approve(tenant, user, id, dto);
  }

  @Patch(':id/reject')
  @RequirePermissions(PERMISSIONS.LEAVE_REJECT)
  @ApiOperation({ summary: 'Reject a pending leave application' })
  async reject(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReviewLeaveDto,
  ): Promise<Leave> {
    return this.leaveService.reject(tenant, user, id, dto);
  }
}
