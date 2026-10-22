import { ReportsService, DashboardMetrics, FilteredAnalytics, SidebarCounts } from './reports.service';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getSidebarCounts(tenant: TenantContext, user: JwtPayload): Promise<SidebarCounts>;
    getDashboard(tenant: TenantContext, period?: string, startDate?: string, endDate?: string): Promise<DashboardMetrics>;
    getAnalytics(tenant: TenantContext, period?: string, startDate?: string, endDate?: string, departmentId?: string, employeeId?: string): Promise<FilteredAnalytics>;
    generateAi(tenant: TenantContext, body: {
        period?: string;
        departmentId?: string;
    }): Promise<{
        reportMarkdown: string;
        modelUsed: string;
    }>;
}
