import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
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
import { Company } from './schemas/company.schema';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('current')
  @RequirePermissions(PERMISSIONS.COMPANY_SETTINGS_VIEW)
  @ApiOperation({
    summary: 'Get active company profile and operating settings',
  })
  async getCurrent(@CurrentTenant() tenant: TenantContext): Promise<Company> {
    return this.companiesService.getCompany(tenant);
  }

  @Patch('current')
  @RequirePermissions(PERMISSIONS.COMPANY_SETTINGS_UPDATE)
  @ApiOperation({
    summary: 'Update company profile, working hours, and localization',
  })
  async updateCurrent(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: UpdateCompanyDto,
  ): Promise<Company> {
    return this.companiesService.updateCompany(tenant, dto);
  }

  @Delete('current')
  @ApiOperation({
    summary:
      'Permanently delete company workspace and all regional data (Owner only)',
  })
  async deleteCurrent(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
  ): Promise<{ success: boolean; message: string }> {
    return this.companiesService.deleteCompany(tenant, user);
  }
}
