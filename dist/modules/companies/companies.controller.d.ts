import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { Company } from './schemas/company.schema';
export declare class CompaniesController {
    private readonly companiesService;
    constructor(companiesService: CompaniesService);
    getCurrent(tenant: TenantContext): Promise<Company>;
    updateCurrent(tenant: TenantContext, dto: UpdateCompanyDto): Promise<Company>;
    deleteCurrent(tenant: TenantContext, user: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
