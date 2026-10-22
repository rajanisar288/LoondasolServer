import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { Branch } from './schemas/branch.schema';
export declare class BranchesController {
    private readonly branchesService;
    constructor(branchesService: BranchesService);
    findAll(tenant: TenantContext): Promise<Branch[]>;
    findOne(tenant: TenantContext, id: string): Promise<Branch>;
    create(tenant: TenantContext, dto: CreateBranchDto): Promise<Branch>;
    update(tenant: TenantContext, id: string, dto: UpdateBranchDto): Promise<Branch>;
    delete(tenant: TenantContext, id: string): Promise<{
        success: boolean;
    }>;
}
