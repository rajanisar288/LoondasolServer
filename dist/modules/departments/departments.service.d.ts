import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Department } from './schemas/department.schema';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/create-department.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
export declare class DepartmentsService {
    private readonly regionalDbManager;
    constructor(regionalDbManager: RegionalDatabaseManager);
    findAll(tenant: TenantContext, branchId?: string): Promise<Department[]>;
    create(tenant: TenantContext, dto: CreateDepartmentDto): Promise<Department>;
    update(tenant: TenantContext, departmentId: string, dto: UpdateDepartmentDto): Promise<Department>;
    delete(tenant: TenantContext, departmentId: string): Promise<{
        success: boolean;
    }>;
}
