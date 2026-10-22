import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Role } from './schemas/role.schema';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { PermissionCode } from '../../common/constants/permissions.constant';
export declare class RolesService {
    private readonly regionalDbManager;
    constructor(regionalDbManager: RegionalDatabaseManager);
    findAll(tenant: TenantContext): Promise<Role[]>;
    getAvailablePermissions(): PermissionCode[];
    create(tenant: TenantContext, dto: CreateRoleDto): Promise<Role>;
    update(tenant: TenantContext, roleId: string, dto: UpdateRoleDto): Promise<Role>;
    delete(tenant: TenantContext, roleId: string): Promise<{
        success: boolean;
    }>;
}
