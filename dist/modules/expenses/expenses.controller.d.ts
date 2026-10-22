import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseStatusDto } from './dto/expense.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { Expense } from './schemas/expense.schema';
export declare class ExpensesController {
    private readonly expensesService;
    constructor(expensesService: ExpensesService);
    findAll(tenant: TenantContext, user: JwtPayload, branchId?: string, category?: string, startDate?: string, endDate?: string): Promise<Expense[]>;
    getSummary(tenant: TenantContext, user: JwtPayload): Promise<{
        totalExpenses: number;
        pendingCount: number;
        approvedCount: number;
        byCategory: Record<string, number>;
        byBranch: Record<string, number>;
    }>;
    create(tenant: TenantContext, user: JwtPayload, dto: CreateExpenseDto): Promise<Expense>;
    updateStatus(tenant: TenantContext, user: JwtPayload, id: string, dto: UpdateExpenseStatusDto): Promise<Expense>;
    delete(tenant: TenantContext, id: string): Promise<{
        success: boolean;
    }>;
}
