import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Branch } from './schemas/branch.schema';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
export declare class BranchesService {
    private readonly regionalDbManager;
    constructor(regionalDbManager: RegionalDatabaseManager);
    findAll(tenant: TenantContext): Promise<Branch[]>;
    findOne(tenant: TenantContext, branchId: string): Promise<Branch>;
    create(tenant: TenantContext, dto: CreateBranchDto): Promise<Branch>;
    update(tenant: TenantContext, branchId: string, dto: UpdateBranchDto): Promise<Branch>;
    delete(tenant: TenantContext, branchId: string): Promise<{
        success: boolean;
    }>;
    validateBranchAccess(region: string, companyId: string, branchId: string): Promise<void>;
}
