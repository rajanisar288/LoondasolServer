import { SuperAdminService } from './superadmin.service';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class SuperAdminController {
    private readonly superAdminService;
    constructor(superAdminService: SuperAdminService);
    getSystemStats(): Promise<Record<string, any>>;
    getAllCompanies(): Promise<any[]>;
    getCompanyDetails(id: string): Promise<any>;
    updateCompanyStatus(id: string, dto: {
        status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    }, user: JwtPayload): Promise<any>;
    getAuditLogs(action?: string, companyId?: string, search?: string, limit?: number, page?: number): Promise<{
        logs: import("./schemas/audit-log.schema").AuditLog[];
        total: number;
        page: number;
        limit: number;
    }>;
    getAllUsers(search?: string): Promise<any[]>;
}
