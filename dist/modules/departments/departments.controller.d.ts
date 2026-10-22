import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/create-department.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { Department } from './schemas/department.schema';
export declare class DepartmentsController {
    private readonly departmentsService;
    constructor(departmentsService: DepartmentsService);
    findAll(tenant: TenantContext, branchId?: string): Promise<Department[]>;
    create(tenant: TenantContext, dto: CreateDepartmentDto): Promise<Department>;
    update(tenant: TenantContext, id: string, dto: UpdateDepartmentDto): Promise<Department>;
    delete(tenant: TenantContext, id: string): Promise<{
        success: boolean;
    }>;
}
