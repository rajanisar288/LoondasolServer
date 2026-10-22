import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { PayrollSlip } from './schemas/payroll-slip.schema';
import { GeneratePayrollDto, UpdateSlipStatusDto, CustomizePayrollSlipDto, BulkEmailPayrollDto, PreviewPayrollHtmlDto } from './dto/payroll.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { MailService } from '../mail/mail.service';
import { UploadService } from '../upload/upload.service';
export declare class PayrollService {
    private readonly regionalDbManager;
    private readonly mailService;
    private readonly uploadService;
    private readonly logger;
    constructor(regionalDbManager: RegionalDatabaseManager, mailService: MailService, uploadService: UploadService);
    findAll(tenant: TenantContext, month?: string, employeeId?: string): Promise<PayrollSlip[]>;
    findOne(tenant: TenantContext, slipId: string): Promise<PayrollSlip>;
    private evaluateFormula;
    convertNumberToWords(amount: number, currency?: string, format?: 'INTERNATIONAL' | 'INDIAN_SOUTH_ASIAN' | string): string;
    generatePdfBuffer(slip: PayrollSlip, companyName: string, currency: string): Buffer;
    private computePdfPassword;
    generatePayroll(tenant: TenantContext, dto: GeneratePayrollDto): Promise<{
        generated: number;
        slips: PayrollSlip[];
        emailedCount?: number;
    }>;
    customizeSlip(tenant: TenantContext, slipId: string, dto: CustomizePayrollSlipDto): Promise<PayrollSlip>;
    sendSingleSlipEmail(tenant: TenantContext, slipId: string): Promise<{
        sent: boolean;
        slip: PayrollSlip;
    }>;
    sendBulkSlipEmails(tenant: TenantContext, dto: BulkEmailPayrollDto): Promise<{
        total: number;
        sent: number;
    }>;
    updateStatus(tenant: TenantContext, slipId: string, dto: UpdateSlipStatusDto): Promise<PayrollSlip>;
    generatePreviewHtml(tenant: TenantContext, dto: PreviewPayrollHtmlDto): Promise<{
        html: string;
    }>;
    generateHtmlSlip(tenant: TenantContext, slipId: string): Promise<string>;
    private renderSlipHtmlDocument;
}
