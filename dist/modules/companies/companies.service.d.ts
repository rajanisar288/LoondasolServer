import { Model } from 'mongoose';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Company } from './schemas/company.schema';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { MasterIdentityDocument } from '../../database/master.schema';
export declare class CompaniesService {
    private readonly regionalDbManager;
    private readonly masterIdentityModel;
    constructor(regionalDbManager: RegionalDatabaseManager, masterIdentityModel: Model<MasterIdentityDocument>);
    getCompany(tenant: TenantContext): Promise<Company>;
    updateCompany(tenant: TenantContext, dto: UpdateCompanyDto): Promise<Company>;
    deleteCompany(tenant: TenantContext, user: JwtPayload): Promise<{
        message: string;
        success: boolean;
    }>;
    getSeatStatus(tenant: TenantContext): Promise<{
        purchasedSeats: number;
        totalActiveSeats: number;
        availableSeats: number;
        plan: string;
        pricePerSeat: number;
        aiLimit: number;
        aiUsed: number;
    }>;
    addSeats(tenant: TenantContext, additionalSeats: number): Promise<{
        success: boolean;
        additionalSeats: number;
        totalSeats: number;
        chargedAmount: number;
    }>;
}
