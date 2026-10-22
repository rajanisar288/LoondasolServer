import { EmployeesService, PaginatedEmployees } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { CreateOnboardingFormDto, UpdateOnboardingFormDto } from './dto/onboarding-form.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { Employee } from './schemas/employee.schema';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class EmployeesController {
    private readonly employeesService;
    constructor(employeesService: EmployeesService);
    getOnboardingForms(tenant: TenantContext, branchId?: string, departmentId?: string): Promise<import("./schemas/onboarding-form.schema").OnboardingFormTemplate[]>;
    getActiveOnboardingForm(tenant: TenantContext, branchId?: string, departmentId?: string): Promise<import("./schemas/onboarding-form.schema").OnboardingFormTemplate | null>;
    createOnboardingForm(tenant: TenantContext, dto: CreateOnboardingFormDto): Promise<import("./schemas/onboarding-form.schema").OnboardingFormTemplate>;
    updateOnboardingForm(tenant: TenantContext, templateId: string, dto: UpdateOnboardingFormDto): Promise<import("./schemas/onboarding-form.schema").OnboardingFormTemplate>;
    deleteOnboardingForm(tenant: TenantContext, templateId: string): Promise<{
        success: boolean;
    }>;
    findAll(tenant: TenantContext, user: JwtPayload, page?: number, limit?: number, search?: string, departmentId?: string, branchId?: string, status?: string, pagination?: string, paginate?: string): Promise<PaginatedEmployees>;
    findOne(tenant: TenantContext, user: JwtPayload, id: string): Promise<Partial<Employee>>;
    create(tenant: TenantContext, dto: CreateEmployeeDto): Promise<{
        employee: Employee;
        invitationLink: string;
    }>;
    update(tenant: TenantContext, id: string, dto: UpdateEmployeeDto): Promise<Employee>;
    updateStatus(tenant: TenantContext, id: string, status: any): Promise<Employee>;
    delete(tenant: TenantContext, id: string): Promise<{
        success: boolean;
    }>;
}
