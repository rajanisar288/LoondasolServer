import { LeaveService } from './leave.service';
import { ApplyLeaveDto, ReviewLeaveDto } from './dto/leave.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { Leave, LeaveStatus } from './schemas/leave.schema';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class LeaveController {
    private readonly leaveService;
    constructor(leaveService: LeaveService);
    apply(tenant: TenantContext, user: JwtPayload, dto: ApplyLeaveDto): Promise<Leave>;
    findMyLeaves(tenant: TenantContext, user: JwtPayload): Promise<Leave[]>;
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
    findAll(tenant: TenantContext, status?: LeaveStatus): Promise<Leave[]>;
    approve(tenant: TenantContext, user: JwtPayload, id: string, dto: ReviewLeaveDto): Promise<Leave>;
    reject(tenant: TenantContext, user: JwtPayload, id: string, dto: ReviewLeaveDto): Promise<Leave>;
}
