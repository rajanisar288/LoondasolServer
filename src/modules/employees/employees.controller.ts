import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService, PaginatedEmployees } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import {
  CreateOnboardingFormDto,
  UpdateOnboardingFormDto,
} from './dto/onboarding-form.dto';
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
import { Employee } from './schemas/employee.schema';
import { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('onboarding-forms')
  @RequirePermissions(PERMISSIONS.EMPLOYEES_VIEW)
  @ApiOperation({ summary: 'List custom onboarding form templates' })
  async getOnboardingForms(
    @CurrentTenant() tenant: TenantContext,
    @Query('branchId') branchId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.employeesService.getOnboardingForms(tenant, {
      branchId,
      departmentId,
    });
  }

  @Get('onboarding-forms/active')
  @ApiOperation({ summary: 'Get active onboarding form for branch/department' })
  async getActiveOnboardingForm(
    @CurrentTenant() tenant: TenantContext,
    @Query('branchId') branchId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.employeesService.getActiveOnboardingForm(tenant, {
      branchId,
      departmentId,
    });
  }

  @Post('onboarding-forms')
  @RequirePermissions(PERMISSIONS.EMPLOYEES_CREATE)
  @ApiOperation({ summary: 'Create custom onboarding form template' })
  async createOnboardingForm(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateOnboardingFormDto,
  ) {
    return this.employeesService.createOnboardingForm(tenant, dto);
  }

  @Patch('onboarding-forms/:templateId')
  @RequirePermissions(PERMISSIONS.EMPLOYEES_UPDATE)
  @ApiOperation({ summary: 'Update custom onboarding form template' })
  async updateOnboardingForm(
    @CurrentTenant() tenant: TenantContext,
    @Param('templateId') templateId: string,
    @Body() dto: UpdateOnboardingFormDto,
  ) {
    return this.employeesService.updateOnboardingForm(tenant, templateId, dto);
  }

  @Delete('onboarding-forms/:templateId')
  @RequirePermissions(PERMISSIONS.EMPLOYEES_DELETE)
  @ApiOperation({ summary: 'Delete custom onboarding form template' })
  async deleteOnboardingForm(
    @CurrentTenant() tenant: TenantContext,
    @Param('templateId') templateId: string,
  ) {
    return this.employeesService.deleteOnboardingForm(tenant, templateId);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.EMPLOYEES_VIEW)
  @ApiOperation({ summary: 'Search and paginate employee directory' })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
    @Query('branchId') branchId?: string,
    @Query('status') status?: string,
    @Query('pagination') pagination?: string,
    @Query('paginate') paginate?: string,
  ): Promise<PaginatedEmployees> {
    return this.employeesService.findAll(tenant, user, {
      page,
      limit,
      search,
      departmentId,
      branchId,
      status,
      pagination,
      paginate,
    });
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.EMPLOYEES_VIEW)
  @ApiOperation({
    summary: 'Get single employee details with permission-checked compensation',
  })
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<Partial<Employee>> {
    return this.employeesService.findOne(tenant, user, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.EMPLOYEES_CREATE)
  @ApiOperation({ summary: 'Add a new employee and create invitation link' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateEmployeeDto,
  ): Promise<{ employee: Employee; invitationLink: string }> {
    return this.employeesService.create(tenant, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.EMPLOYEES_UPDATE)
  @ApiOperation({ summary: 'Update employee record' })
  async update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<Employee> {
    return this.employeesService.update(tenant, id, dto);
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.EMPLOYEES_UPDATE)
  @ApiOperation({ summary: 'Update employee active or inactive status' })
  async updateStatus(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body('status') status: any,
  ): Promise<Employee> {
    return this.employeesService.updateStatus(tenant, id, status);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.EMPLOYEES_DELETE)
  @ApiOperation({ summary: 'Delete employee record' })
  async delete(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.employeesService.delete(tenant, id);
  }
}
