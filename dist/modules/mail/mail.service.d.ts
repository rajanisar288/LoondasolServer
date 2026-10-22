import { ConfigService } from '@nestjs/config';
export interface VerificationEmailData {
    name: string;
    companyName: string;
    code: string;
    expiresInMinutes: number;
}
export interface EmployeeInvitationEmailData {
    employeeName: string;
    companyName: string;
    designation: string;
    departmentName?: string;
    inviteLink: string;
    expiresInHours: number;
}
export declare class MailService {
    private readonly configService;
    private readonly logger;
    private transporter;
    private readonly fromAddress;
    constructor(configService: ConfigService);
    private initTransporter;
    sendVerificationCodeEmail(to: string, data: VerificationEmailData): Promise<boolean>;
    sendEmployeeInvitationEmail(to: string, data: EmployeeInvitationEmailData): Promise<boolean>;
    sendBroadcastEmail(to: string, data: {
        companyName: string;
        subject: string;
        body: string;
        senderName?: string;
    }): Promise<boolean>;
    sendPasswordResetOtpEmail(to: string, data: {
        name: string;
        code: string;
        expiresInMinutes: number;
    }): Promise<boolean>;
    sendSalarySlipEmail(to: string, data: {
        employeeName: string;
        companyName: string;
        month: string;
        currency: string;
        grossEarnings: number;
        totalDeductions: number;
        netSalary: number;
        netPayInWords: string;
        presentDays: number;
        workingDays: number;
        paidLeaveDays: number;
        lopDays: number;
        slipHtmlUrl: string;
        pdfUrl?: string;
        isPasswordProtected?: boolean;
        pdfPasswordHint?: string;
        pdfBuffer?: Buffer;
    }): Promise<boolean>;
}
