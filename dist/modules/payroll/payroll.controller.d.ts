import { PayrollService } from './payroll.service';
import { GeneratePayrollDto, UpdateSlipStatusDto, CustomizePayrollSlipDto, BulkEmailPayrollDto, PreviewPayrollHtmlDto } from './dto/payroll.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { PayrollSlip } from './schemas/payroll-slip.schema';
export declare class PayrollController {
    private readonly payrollService;
    constructor(payrollService: PayrollService);
    findAll(tenant: TenantContext, month?: string, employeeId?: string): Promise<PayrollSlip[]>;
    findOne(tenant: TenantContext, id: string): Promise<PayrollSlip>;
    getHtmlSlip(tenant: TenantContext, id: string): Promise<string>;
    previewHtml(tenant: TenantContext, dto: PreviewPayrollHtmlDto): Promise<{
        html: string;
    }>;
    generate(tenant: TenantContext, dto: GeneratePayrollDto): Promise<{
        generated: number;
        slips: PayrollSlip[];
        emailedCount?: number;
    }>;
    customizeSlip(tenant: TenantContext, id: string, dto: CustomizePayrollSlipDto): Promise<PayrollSlip>;
    sendSingleEmail(tenant: TenantContext, id: string): Promise<{
        sent: boolean;
        slip: PayrollSlip;
    }>;
    sendBulkEmail(tenant: TenantContext, dto: BulkEmailPayrollDto): Promise<{
        total: number;
        sent: number;
    }>;
    updateStatus(tenant: TenantContext, id: string, dto: UpdateSlipStatusDto): Promise<PayrollSlip>;
}
