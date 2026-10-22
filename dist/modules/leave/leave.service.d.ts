import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Leave, LeaveStatus } from './schemas/leave.schema';
import { ApplyLeaveDto, ReviewLeaveDto } from './dto/leave.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class LeaveService {
    private readonly regionalDbManager;
    constructor(regionalDbManager: RegionalDatabaseManager);
    apply(tenant: TenantContext, user: JwtPayload, dto: ApplyLeaveDto): Promise<Leave>;
    findMyLeaves(tenant: TenantContext, user: JwtPayload): Promise<Leave[]>;
    findAll(tenant: TenantContext, status?: LeaveStatus): Promise<Leave[]>;
    approve(tenant: TenantContext, user: JwtPayload, leaveId: string, dto: ReviewLeaveDto): Promise<Leave>;
    reject(tenant: TenantContext, user: JwtPayload, leaveId: string, dto: ReviewLeaveDto): Promise<Leave>;
    getBalances(tenant: TenantContext, user: JwtPayload): Promise<{
        totalYearlyQuota: number;
        totalUsedYearly: number;
        remainingYearly: number;
        monthlyLimit: number;
        totalUsedThisMonth: number;
        remainingThisMonth: number;
        types: {
            id: string;
            name: string;
            quota: number;
            monthlyLimit: number;
            usedYearly: number;
            remainingYearly: number;
            usedThisMonth: number;
            remainingThisMonth: number;
            isPaid: boolean;
        }[];
    }>;
}
