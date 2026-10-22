import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Role, RoleSchema } from './schemas/role.schema';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import {
  ALL_PERMISSIONS,
  PermissionCode,
} from '../../common/constants/permissions.constant';

@Injectable()
export class RolesService {
  constructor(private readonly regionalDbManager: RegionalDatabaseManager) {}

  // List all available system and custom roles for tenant
  async findAll(tenant: TenantContext): Promise<Role[]> {
    const model = await this.regionalDbManager.getModel<Role>(
      tenant.region,
      Role.name,
      RoleSchema,
    );

    return model
      .find({ companyId: tenant.companyId })
      .sort({ isSystem: -1, name: 1 })
      .lean();
  }

  // Returns all registered granular permission codes in the system
  getAvailablePermissions(): PermissionCode[] {
    return ALL_PERMISSIONS;
  }

  // Create a new custom role for the tenant
  async create(tenant: TenantContext, dto: CreateRoleDto): Promise<Role> {
    const model = await this.regionalDbManager.getModel<Role>(
      tenant.region,
      Role.name,
      RoleSchema,
    );

    const existing = await model
      .findOne({ companyId: tenant.companyId, name: dto.name.trim() })
      .lean();
    if (existing) {
      throw new ConflictException(
        `Role with name "${dto.name}" already exists in your workspace`,
      );
    }

    // Sanitize and preserve provided permissions
    const validPerms = (dto.permissions || []).filter(
      (p) => typeof p === 'string' && p.trim().length > 0,
    );

    return model.create({
      companyId: tenant.companyId,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      isSystem: false,
      permissions: validPerms,
    });
  }

  // Update permissions or metadata of an existing custom role
  async update(
    tenant: TenantContext,
    roleId: string,
    dto: UpdateRoleDto,
  ): Promise<Role> {
    const model = await this.regionalDbManager.getModel<Role>(
      tenant.region,
      Role.name,
      RoleSchema,
    );

    const role = await model.findOne({
      companyId: tenant.companyId,
      _id: roleId,
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem && dto.name && dto.name !== role.name) {
      throw new BadRequestException('System role names cannot be modified');
    }

    if (dto.name) role.name = dto.name.trim();
    if (dto.description !== undefined)
      role.description = dto.description?.trim();
    if (dto.permissions) {
      role.permissions = (dto.permissions || []).filter(
        (p) => typeof p === 'string' && p.trim().length > 0,
      );
    }

    return role.save();
  }

  // Delete custom role (system roles are protected)
  async delete(
    tenant: TenantContext,
    roleId: string,
  ): Promise<{ success: boolean }> {
    const model = await this.regionalDbManager.getModel<Role>(
      tenant.region,
      Role.name,
      RoleSchema,
    );

    const role = await model.findOne({
      companyId: tenant.companyId,
      _id: roleId,
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be deleted');
    }

    await model.deleteOne({ _id: roleId, companyId: tenant.companyId });
    return { success: true };
  }
}
