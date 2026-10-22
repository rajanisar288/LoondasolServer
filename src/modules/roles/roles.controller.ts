import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import {
  CurrentTenant,
  TenantContext,
} from '../../common/decorators/current-tenant.decorator';
import {
  PERMISSIONS,
  PermissionCode,
} from '../../common/constants/permissions.constant';
import { Role } from './schemas/role.schema';

@ApiTags('Roles & Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ROLES_VIEW, PERMISSIONS.EMPLOYEES_VIEW)
  @ApiOperation({ summary: 'List all company roles' })
  async findAll(@CurrentTenant() tenant: TenantContext): Promise<Role[]> {
    return this.rolesService.findAll(tenant);
  }

  @Get('permissions')
  @RequirePermissions(PERMISSIONS.PERMISSIONS_VIEW, PERMISSIONS.ROLES_VIEW, PERMISSIONS.EMPLOYEES_VIEW)
  @ApiOperation({ summary: 'List all available granular system permissions' })
  getPermissions(): PermissionCode[] {
    return this.rolesService.getAvailablePermissions();
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ROLES_CREATE, PERMISSIONS.EMPLOYEES_CREATE)
  @ApiOperation({ summary: 'Create a custom role' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateRoleDto,
  ): Promise<Role> {
    return this.rolesService.create(tenant, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ROLES_UPDATE, PERMISSIONS.EMPLOYEES_UPDATE)
  @ApiOperation({ summary: 'Update role permissions' })
  async update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<Role> {
    return this.rolesService.update(tenant, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ROLES_DELETE, PERMISSIONS.EMPLOYEES_DELETE)
  @ApiOperation({ summary: 'Delete custom role' })
  async delete(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.rolesService.delete(tenant, id);
  }
}
