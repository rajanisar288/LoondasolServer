import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { MasterIdentityDocument } from '../../database/master.schema';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { PasswordService } from '../auth/password.service';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
export declare class SuperAdminService implements OnModuleInit {
    private readonly masterIdentityModel;
    private readonly auditLogModel;
    private readonly regionalDbManager;
    private readonly passwordService;
    private readonly configService;
    private readonly logger;
    constructor(masterIdentityModel: Model<MasterIdentityDocument>, auditLogModel: Model<AuditLogDocument>, regionalDbManager: RegionalDatabaseManager, passwordService: PasswordService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    logEvent(params: {
        action: string;
        userId?: string;
        userEmail?: string;
        companyId?: string;
        companyName?: string;
        region?: string;
        ipAddress?: string;
        details?: Record<string, any>;
    }): Promise<AuditLogDocument>;
    getSystemStats(): Promise<Record<string, any>>;
    getAllCompanies(): Promise<any[]>;
    getCompanyDetails(companyId: string): Promise<any>;
    updateCompanyStatus(companyId: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED', superAdminUser: {
        userId: string;
        email: string;
    }): Promise<any>;
    getAuditLogs(query?: {
        action?: string;
        companyId?: string;
        search?: string;
        limit?: number;
        page?: number;
    }): Promise<{
        logs: AuditLog[];
        total: number;
        page: number;
        limit: number;
    }>;
    getAllUsers(search?: string): Promise<any[]>;
}
