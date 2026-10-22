import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { PermissionCode } from '../../common/constants/permissions.constant';
import { Role } from './schemas/role.schema';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAll(tenant: TenantContext): Promise<Role[]>;
    getPermissions(): PermissionCode[];
    create(tenant: TenantContext, dto: CreateRoleDto): Promise<Role>;
    update(tenant: TenantContext, id: string, dto: UpdateRoleDto): Promise<Role>;
    delete(tenant: TenantContext, id: string): Promise<{
        success: boolean;
    }>;
}
