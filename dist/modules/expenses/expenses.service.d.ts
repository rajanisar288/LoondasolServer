import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Expense } from './schemas/expense.schema';
import { CreateExpenseDto, UpdateExpenseStatusDto } from './dto/expense.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class ExpensesService {
    private readonly regionalDbManager;
    constructor(regionalDbManager: RegionalDatabaseManager);
    findAll(tenant: TenantContext, user: JwtPayload, filters?: {
        branchId?: string;
        category?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<Expense[]>;
    getSummary(tenant: TenantContext, user: JwtPayload): Promise<{
        totalExpenses: number;
        pendingCount: number;
        approvedCount: number;
        byCategory: Record<string, number>;
        byBranch: Record<string, number>;
    }>;
    create(tenant: TenantContext, user: JwtPayload, dto: CreateExpenseDto): Promise<Expense>;
    updateStatus(tenant: TenantContext, user: JwtPayload, expenseId: string, dto: UpdateExpenseStatusDto): Promise<Expense>;
    delete(tenant: TenantContext, expenseId: string): Promise<{
        success: boolean;
    }>;
}
