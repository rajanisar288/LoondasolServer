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
import { DepartmentsService } from './departments.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dto/create-department.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import {
  CurrentTenant,
  TenantContext,
} from '../../common/decorators/current-tenant.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Department } from './schemas/department.schema';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.DEPARTMENTS_VIEW)
  @ApiOperation({ summary: 'List company departments, optionally filtered by branch' })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query('branchId') branchId?: string,
  ): Promise<Department[]> {
    return this.departmentsService.findAll(tenant, branchId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.DEPARTMENTS_CREATE)
  @ApiOperation({ summary: 'Create a new department' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateDepartmentDto,
  ): Promise<Department> {
    return this.departmentsService.create(tenant, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.DEPARTMENTS_UPDATE)
  @ApiOperation({ summary: 'Update a department' })
  async update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ): Promise<Department> {
    return this.departmentsService.update(tenant, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.DEPARTMENTS_DELETE)
  @ApiOperation({ summary: 'Delete a department' })
  async delete(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.departmentsService.delete(tenant, id);
  }
}
