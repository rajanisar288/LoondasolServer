import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  ReportsService,
  DashboardMetrics,
  FilteredAnalytics,
  SidebarCounts,
} from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import {
  CurrentTenant,
  TenantContext,
} from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { PERMISSIONS } from '../../common/constants/permissions.constant';

@ApiTags('Reports & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sidebar-counts')
  @ApiOperation({ summary: 'Get real-time operational counts for sidebar badges' })
  async getSidebarCounts(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
  ): Promise<SidebarCounts> {
    return this.reportsService.getSidebarCounts(tenant, user);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get aggregated dashboard KPIs and metrics with date filters' })
  async getDashboard(
    @CurrentTenant() tenant: TenantContext,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<DashboardMetrics> {
    return this.reportsService.getDashboardMetrics(tenant, {
      period,
      startDate,
      endDate,
    });
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get filtered operational telemetry and late arrival metrics',
  })
  async getAnalytics(
    @CurrentTenant() tenant: TenantContext,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('departmentId') departmentId?: string,
    @Query('employeeId') employeeId?: string,
  ): Promise<FilteredAnalytics> {
    return this.reportsService.getFilteredAnalytics(tenant, {
      period,
      startDate,
      endDate,
      departmentId,
      employeeId,
    });
  }

  @Post('generate-ai')
  @RequirePermissions(PERMISSIONS.REPORTS_GENERATE)
  @ApiOperation({
    summary: 'Generate executive summary report with Google Gemini AI',
  })
  async generateAi(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { period?: string; departmentId?: string },
  ) {
    return this.reportsService.generateAiReport(tenant, body);
  }
}
