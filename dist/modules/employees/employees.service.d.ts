import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Employee, EmployeeStatus } from './schemas/employee.schema';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { OnboardingFormTemplate } from './schemas/onboarding-form.schema';
import { CreateOnboardingFormDto, UpdateOnboardingFormDto } from './dto/onboarding-form.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { PasswordService } from '../auth/password.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { Model } from 'mongoose';
import { MasterIdentityDocument } from '../../database/master.schema';
export interface PaginatedEmployees {
    data: Partial<Employee>[];
    total: number;
    page: number;
    limit: number;
}
export declare class EmployeesService {
    private readonly regionalDbManager;
    private readonly passwordService;
    private readonly mailService;
    private readonly configService;
    private readonly masterIdentityModel;
    private readonly logger;
    constructor(regionalDbManager: RegionalDatabaseManager, passwordService: PasswordService, mailService: MailService, configService: ConfigService, masterIdentityModel: Model<MasterIdentityDocument>);
    findAll(tenant: TenantContext, user: JwtPayload, query: {
        page?: number;
        limit?: number;
        search?: string;
        departmentId?: string;
        branchId?: string;
        status?: string;
        pagination?: boolean | string;
        paginate?: boolean | string;
    }): Promise<PaginatedEmployees>;
    findOne(tenant: TenantContext, user: JwtPayload, employeeId: string): Promise<Partial<Employee>>;
    create(tenant: TenantContext, dto: CreateEmployeeDto): Promise<{
        employee: Employee;
        invitationLink: string;
    }>;
    update(tenant: TenantContext, employeeId: string, dto: UpdateEmployeeDto): Promise<Employee>;
    updateStatus(tenant: TenantContext, employeeId: string, status: EmployeeStatus): Promise<Employee>;
    delete(tenant: TenantContext, employeeId: string): Promise<{
        success: boolean;
    }>;
    getOnboardingForms(tenant: TenantContext, query?: {
        branchId?: string;
        departmentId?: string;
    }): Promise<OnboardingFormTemplate[]>;
    getActiveOnboardingForm(tenant: TenantContext, query?: {
        branchId?: string;
        departmentId?: string;
    }): Promise<OnboardingFormTemplate | null>;
    createOnboardingForm(tenant: TenantContext, dto: CreateOnboardingFormDto): Promise<OnboardingFormTemplate>;
    updateOnboardingForm(tenant: TenantContext, templateId: string, dto: UpdateOnboardingFormDto): Promise<OnboardingFormTemplate>;
    deleteOnboardingForm(tenant: TenantContext, templateId: string): Promise<{
        success: boolean;
    }>;
}
