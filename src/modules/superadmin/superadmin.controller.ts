import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuperAdminService } from './superadmin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Super Admin System Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('superadmin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get system-wide telemetry stats & KPIs' })
  async getSystemStats() {
    return this.superAdminService.getSystemStats();
  }

  @Get('companies')
  @ApiOperation({ summary: 'List all registered companies across system' })
  async getAllCompanies() {
    return this.superAdminService.getAllCompanies();
  }

  @Get('companies/:id')
  @ApiOperation({ summary: 'Get company details including employees directory' })
  async getCompanyDetails(@Param('id') id: string) {
    return this.superAdminService.getCompanyDetails(id);
  }

  @Patch('companies/:id/status')
  @ApiOperation({ summary: 'Activate, deactivate, or suspend a company' })
  async updateCompanyStatus(
    @Param('id') id: string,
    @Body() dto: { status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.superAdminService.updateCompanyStatus(id, dto.status, user);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Query and filter system audit event logs' })
  async getAuditLogs(
    @Query('action') action?: string,
    @Query('companyId') companyId?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.superAdminService.getAuditLogs({ action, companyId, search, limit, page });
  }

  @Get('users')
  @ApiOperation({ summary: 'Search and list users across all companies' })
  async getAllUsers(@Query('search') search?: string) {
    return this.superAdminService.getAllUsers(search);
  }
}
