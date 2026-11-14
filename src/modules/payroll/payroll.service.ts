import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { randomUUID, createHash } from 'crypto';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import {
  PayrollSlip,
  PayrollSlipSchema,
  PayrollSlipStatus,
} from './schemas/payroll-slip.schema';
import {
  Employee,
  EmployeeSchema,
  EmployeeStatus,
} from '../employees/schemas/employee.schema';
import {
  Attendance,
  AttendanceSchema,
} from '../attendance/schemas/attendance.schema';
import {
  Leave,
  LeaveSchema,
  LeaveStatus,
} from '../leave/schemas/leave.schema';
import {
  Company,
  CompanySchema,
} from '../companies/schemas/company.schema';
import {
  Branch,
  BranchSchema,
} from '../branches/schemas/branch.schema';
import {
  GeneratePayrollDto,
  UpdateSlipStatusDto,
  CustomizePayrollSlipDto,
  BulkEmailPayrollDto,
  PreviewPayrollHtmlDto,
} from './dto/payroll.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { MailService } from '../mail/mail.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    private readonly regionalDbManager: RegionalDatabaseManager,
    private readonly mailService: MailService,
    private readonly uploadService: UploadService,
  ) {}

  async findAll(
    tenant: TenantContext,
    month?: string,
    employeeId?: string,
  ): Promise<PayrollSlip[]> {
    const slipModel = await this.regionalDbManager.getModel<PayrollSlip>(
      tenant.region,
      PayrollSlip.name,
      PayrollSlipSchema,
    );

    const query: any = { companyId: tenant.companyId };
    if (month) query.month = month;
    if (employeeId) query.employeeId = employeeId;

    return slipModel.find(query).sort({ month: -1, employeeName: 1 }).lean();
  }

  async findOne(tenant: TenantContext, slipId: string): Promise<PayrollSlip> {
    const slipModel = await this.regionalDbManager.getModel<PayrollSlip>(
      tenant.region,
      PayrollSlip.name,
      PayrollSlipSchema,
    );
    const slip = await slipModel.findOne({ companyId: tenant.companyId, slipId }).lean();
    if (!slip) {
      throw new NotFoundException('Payroll slip not found');
    }
    return slip;
  }

  // Safely evaluates custom salary formula expressions
  private evaluateFormula(
    formula: string,
    vars: {
      BASE: number;
      DAILY_RATE: number;
      HOURLY_RATE: number;
      WORKING_DAYS: number;
      PRESENT_DAYS: number;
      PAID_LEAVES: number;
      LOP_DAYS: number;
      LATE_DAYS: number;
      OVERTIME_HOURS: number;
    },
  ): number {
    if (!formula || !formula.trim()) return 0;
    try {
      let expr = formula.toUpperCase();
      const sortedKeys = Object.keys(vars).sort((a, b) => b.length - a.length);
      for (const key of sortedKeys) {
        const val = Number((vars as any)[key] || 0);
        expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(val));
      }
      // Allow only numbers, decimal points, parentheses, whitespace, and + - * / %
      if (!/^[0-9+\-*/%.()\s]+$/.test(expr)) {
        return 0;
      }
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${expr});`)();
      const num = Number(result);
      return Number.isFinite(num) ? Math.max(0, Math.round(num * 100) / 100) : 0;
    } catch {
      return 0;
    }
  }

  // Converts numeric amount into words (International or Indian/South Asian Lakh/Crore system)
  convertNumberToWords(
    amount: number,
    currency = 'USD',
    format: 'INTERNATIONAL' | 'INDIAN_SOUTH_ASIAN' | string = 'INTERNATIONAL',
  ): string {
    const rounded = Math.max(0, Math.round(amount || 0));
    if (rounded === 0) return `Zero ${currency} Only`;

    const ones = [
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen',
    ];
    const tens = [
      '',
      '',
      'Twenty',
      'Thirty',
      'Forty',
      'Fifty',
      'Sixty',
      'Seventy',
      'Eighty',
      'Ninety',
    ];

    const belowHundred = (n: number): string => {
      if (n < 20) return ones[n];
      const t = Math.floor(n / 10);
      const o = n % 10;
      return `${tens[t]}${o > 0 ? '-' + ones[o] : ''}`;
    };

    const belowThousand = (n: number): string => {
      const h = Math.floor(n / 100);
      const rem = n % 100;
      let res = '';
      if (h > 0) res += `${ones[h]} Hundred`;
      if (rem > 0) res += `${res ? ' ' : ''}${belowHundred(rem)}`;
      return res;
    };

    if (format === 'INDIAN_SOUTH_ASIAN') {
      let n = rounded;
      const parts: string[] = [];
      const crore = Math.floor(n / 10000000);
      n %= 10000000;
      const lakh = Math.floor(n / 100000);
      n %= 100000;
      const thousand = Math.floor(n / 1000);
      n %= 1000;
      const rest = n;

      if (crore > 0) parts.push(`${belowThousand(crore)} Crore`);
      if (lakh > 0) parts.push(`${belowHundred(lakh)} Lakh`);
      if (thousand > 0) parts.push(`${belowHundred(thousand)} Thousand`);
      if (rest > 0) parts.push(belowThousand(rest));

      return `${parts.join(' ')} ${currency} Only`;
    }

    // International format
    let n = rounded;
    const scales = ['', 'Thousand', 'Million', 'Billion'];
    const chunks: string[] = [];
    let scaleIdx = 0;

    while (n > 0 && scaleIdx < scales.length) {
      const chunk = n % 1000;
      if (chunk > 0) {
        const chunkWords = belowThousand(chunk);
        const scale = scales[scaleIdx];
        chunks.unshift(`${chunkWords}${scale ? ' ' + scale : ''}`);
      }
      n = Math.floor(n / 1000);
      scaleIdx++;
    }

    return `${chunks.join(' ')} ${currency} Only`;
  }

  // Generates a clean, standards-compliant PDF binary buffer for Cloudinary archiving & email attachment
  generatePdfBuffer(
    slip: PayrollSlip,
    companyName: string,
    currency: string,
  ): Buffer {
    const cleanText = (str: string) =>
      String(str || '')
        .replace(/[()\\]/g, '')
        .replace(/[^\x20-\x7E]/g, ' ');

    const lines: string[] = [
      `${companyName.toUpperCase()} - OFFICIAL SALARY SLIP`,
      `Pay Period: ${slip.month} | Template v${slip.templateVersion || 1} | Status: ${slip.status}`,
      `------------------------------------------------------------------------`,
      `Employee Name : ${slip.employeeName} (${slip.employeeId})`,
      `Designation   : ${slip.designation || 'Staff'} | Dept: ${slip.departmentName || 'General'}`,
      `Branch        : ${slip.branchName || 'Headquarters'} | Email: ${slip.employeeEmail}`,
      `------------------------------------------------------------------------`,
      `ATTENDANCE & LEAVE SUMMARY`,
      `Working Days: ${slip.workingDays} | Present: ${slip.presentDays} | Paid Leave: ${slip.paidLeaveDays || 0} | LOP Days: ${slip.lopDays || 0}`,
      `Late Arrivals: ${slip.lateDays} days | Overtime Logged: ${slip.overtimeHours} hrs`,
      `------------------------------------------------------------------------`,
      `EARNINGS & ALLOWANCES (${currency})`,
    ];

    const earnings = slip.earningsBreakdown?.length
      ? slip.earningsBreakdown
      : [
          { name: 'Base Salary', amount: slip.baseSalary },
          { name: 'Overtime Bonus', amount: slip.overtimeBonus },
        ];

    for (const item of earnings) {
      lines.push(
        `  + ${item.name.padEnd(42, ' ')} : ${currency} ${Number(item.amount || 0).toLocaleString()}`,
      );
    }
    const gross =
      slip.grossEarnings ??
      earnings.reduce((s, i) => s + Number(i.amount || 0), 0);
    lines.push(`  TOTAL GROSS EARNINGS                         : ${currency} ${gross.toLocaleString()}`);
    lines.push(`------------------------------------------------------------------------`);
    lines.push(`DEDUCTIONS & RECOVERIES (${currency})`);

    const deductions = slip.deductionsBreakdown?.length
      ? slip.deductionsBreakdown
      : [
          { name: 'Late Arrival Penalties', amount: slip.lateDeductions },
          { name: 'Loss of Pay (LOP)', amount: slip.lopDeductions || 0 },
          { name: `Income Tax (${slip.taxPercentage || 0}%)`, amount: slip.taxDeductions || 0 },
        ];

    for (const item of deductions) {
      lines.push(
        `  - ${item.name.padEnd(42, ' ')} : -${currency} ${Number(item.amount || 0).toLocaleString()}`,
      );
    }
    const totalDed =
      slip.totalDeductions ??
      deductions.reduce((s, i) => s + Number(i.amount || 0), 0);
    lines.push(`  TOTAL DEDUCTIONS                             : -${currency} ${totalDed.toLocaleString()}`);
    lines.push(`========================================================================`);
    lines.push(`NET TAKE-HOME SALARY : ${currency} ${slip.netSalary.toLocaleString()}`);
    lines.push(`In Words: ${slip.netPayInWords || this.convertNumberToWords(slip.netSalary, currency)}`);
    lines.push(`========================================================================`);
    if (slip.eSignHash) {
      lines.push(`Digital e-Sign Verification Stamp: ${slip.eSignHash}`);
    }
    if (slip.notes) {
      lines.push(`Remarks: ${slip.notes}`);
    }

    // Build PDF content stream
    let streamContent = 'BT\n/F1 10 Tf\n50 780 Td\n14 TL\n';
    for (const line of lines) {
      streamContent += `(${cleanText(line)}) Tj T*\n`;
    }
    streamContent += 'ET\n';

    const objects: string[] = [];
    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    objects.push(
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 595 842] /Contents 5 0 R >>\nendobj\n',
    );
    objects.push(
      '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n',
    );
    objects.push(
      `5 0 obj\n<< /Length ${Buffer.byteLength(streamContent, 'utf8')} >>\nstream\n${streamContent}endstream\nendobj\n`,
    );

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [0];
    for (const obj of objects) {
      offsets.push(Buffer.byteLength(pdf, 'utf8'));
      pdf += obj;
    }
    const xrefOffset = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return Buffer.from(pdf, 'utf8');
  }

  private computePdfPassword(
    rule: string | undefined,
    emp: { employeeId: string; firstName?: string; lastName?: string },
    month: string,
  ): { password: string; hint: string } {
    const year = month.split('-')[0] || new Date().getFullYear().toString();
    if (rule === 'NAME4_YEAR') {
      const cleanName = (emp.firstName || 'USER')
        .replace(/[^a-zA-Z]/g, '')
        .toUpperCase()
        .padEnd(4, 'X')
        .slice(0, 4);
      return {
        password: `${cleanName}${year}`,
        hint: 'First 4 letters of your first name (UPPERCASE) + Pay Year (e.g. JOHN2026)',
      };
    }
    const last4 = String(emp.employeeId || '0000')
      .slice(-4)
      .toUpperCase();
    return {
      password: last4,
      hint: 'Last 4 characters of your Employee ID (UPPERCASE)',
    };
  }

  async generatePayroll(
    tenant: TenantContext,
    dto: GeneratePayrollDto,
  ): Promise<{ generated: number; slips: PayrollSlip[]; emailedCount?: number }> {
    const slipModel = await this.regionalDbManager.getModel<PayrollSlip>(
      tenant.region,
      PayrollSlip.name,
      PayrollSlipSchema,
    );
    const empModel = await this.regionalDbManager.getModel<Employee>(
      tenant.region,
      Employee.name,
      EmployeeSchema,
    );
    const attModel = await this.regionalDbManager.getModel<Attendance>(
      tenant.region,
      Attendance.name,
      AttendanceSchema,
    );
    const leaveModel = await this.regionalDbManager.getModel<Leave>(
      tenant.region,
      Leave.name,
      LeaveSchema,
    );
    const compModel = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );

    const company = await compModel.findOne({ companyId: tenant.companyId }).lean();
    const payrollConfig: any = company?.payrollConfig || {
      lateFineType: 'PERCENTAGE',
      lateFineValue: 2,
      overtimeMultiplier: 1.5,
      salaryPayDay: 1,
      autoSalarySlipEnabled: false,
      autoSendEmail: false,
      defaultTaxPercentage: 0,
      enableLopDeduction: true,
      standardWorkingDays: 22,
      templateVersion: 1,
      templateLayout: 'MODERN_EXECUTIVE',
      numberWordsFormat: 'INTERNATIONAL',
      customComponents: [],
    };

    const leavePolicyTypes = company?.leavePolicy?.leaveTypes || [
      { id: 'ANNUAL', name: 'Annual / Paid Leave', isPaid: true },
      { id: 'SICK', name: 'Sick Leave', isPaid: true },
      { id: 'CASUAL', name: 'Casual Leave', isPaid: true },
    ];
    const paidLeaveTypeSet = new Set(
      leavePolicyTypes.filter((t: any) => t.isPaid !== false).map((t: any) => t.id),
    );

    const empFilter: any = {
      companyId: tenant.companyId,
      status: EmployeeStatus.ACTIVE,
    };
    if (dto.employeeIds && dto.employeeIds.length > 0) {
      empFilter.employeeId = { $in: dto.employeeIds };
    }

    const employees = await empModel.find(empFilter).lean();
    const slips: PayrollSlip[] = [];
    const standardWorkingDays = Number(payrollConfig.standardWorkingDays) || 22;
    const currency = company?.currency || 'USD';
    const companyName = company?.name || 'WorkivLab';

    // Template snapshot frozen for versioned immutability
    const templateSnapshot = {
      ...payrollConfig,
      companyName,
      companyLogoUrl: company?.logoUrl || '',
      companyAddress: company?.address || '',
      companyCity: company?.city || '',
      currency,
      capturedAt: new Date().toISOString(),
    };

    for (const emp of employees) {
      const baseSalary = Number(emp.salary || 0);

      // 1. Attendance integration
      const attendances = await attModel
        .find({
          companyId: tenant.companyId,
          employeeId: emp.employeeId,
          date: { $regex: `^${dto.month}` },
        })
        .lean();

      let presentDays = 0;
      let lateDays = 0;
      let overtimeHours = 0;

      for (const att of attendances) {
        if (att.status === 'PRESENT' || att.status === 'LATE' || att.status === 'HALF_DAY') {
          presentDays += att.status === 'HALF_DAY' ? 0.5 : 1;
        }
        if (att.isLate || att.status === 'LATE') {
          lateDays++;
        }
        if (att.totalHours && att.totalHours > 8) {
          overtimeHours += Math.round((att.totalHours - 8) * 10) / 10;
        }
      }

      // 2. Leave module integration (Paid leaves vs Unpaid/LOP leaves)
      const approvedLeaves = await leaveModel
        .find({
          companyId: tenant.companyId,
          employeeId: emp.employeeId,
          status: LeaveStatus.APPROVED,
          startDate: { $regex: `^${dto.month}` },
        })
        .lean();

      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;
      for (const lv of approvedLeaves) {
        const dCount = Number(lv.daysCount || 1);
        if (paidLeaveTypeSet.has(lv.leaveType) && lv.leaveType !== 'UNPAID') {
          paidLeaveDays += dCount;
        } else {
          unpaidLeaveDays += dCount;
        }
      }

      // Calculate absent & LOP days
      // If no attendance records logged yet for the month, default presentDays to standardWorkingDays - (paidLeaveDays + unpaidLeaveDays) so slips are realistic
      if (attendances.length === 0) {
        presentDays = Math.max(0, standardWorkingDays - paidLeaveDays - unpaidLeaveDays);
      }

      const accountedDays = presentDays + paidLeaveDays;
      const absentDays = Math.max(0, standardWorkingDays - accountedDays);
      const lopDays = Math.max(unpaidLeaveDays, absentDays);

      const dailyRate = baseSalary > 0 ? baseSalary / standardWorkingDays : 0;
      const hourlyRate = dailyRate > 0 ? dailyRate / 8 : 0;

      // Late deductions
      let lateDeductions = 0;
      if (payrollConfig.lateFineType === 'PERCENTAGE') {
        lateDeductions = Math.round(dailyRate * ((payrollConfig.lateFineValue || 0) / 100) * lateDays);
      } else {
        lateDeductions = Math.round((payrollConfig.lateFineValue || 0) * lateDays);
      }

      // LOP deduction
      const lopDeductions =
        payrollConfig.enableLopDeduction !== false
          ? Math.round(dailyRate * lopDays)
          : 0;

      // Overtime Bonus
      const overtimeBonus = Math.round(
        overtimeHours * hourlyRate * (payrollConfig.overtimeMultiplier || 1.5),
      );

      // 3. Evaluate Custom Salary Components & Formula Builder
      const formulaVars = {
        BASE: baseSalary,
        DAILY_RATE: dailyRate,
        HOURLY_RATE: hourlyRate,
        WORKING_DAYS: standardWorkingDays,
        PRESENT_DAYS: presentDays,
        PAID_LEAVES: paidLeaveDays,
        LOP_DAYS: lopDays,
        LATE_DAYS: lateDays,
        OVERTIME_HOURS: overtimeHours,
      };

      const earningsBreakdown: Array<{
        id: string;
        name: string;
        amount: number;
        calcMode?: string;
        formula?: string;
        isManual?: boolean;
      }> = [
        { id: 'BASE', name: 'Basic Salary', amount: baseSalary, calcMode: 'FIXED' },
      ];

      if (overtimeBonus > 0 || payrollConfig.showOvertimeHours !== false) {
        earningsBreakdown.push({
          id: 'OVERTIME',
          name: `Overtime Compensation (${overtimeHours}h)`,
          amount: overtimeBonus,
          calcMode: 'FORMULA',
        });
      }

      const deductionsBreakdown: Array<{
        id: string;
        name: string;
        amount: number;
        calcMode?: string;
        formula?: string;
        isManual?: boolean;
      }> = [];

      if (lateDeductions > 0 || payrollConfig.showLateArrivals !== false) {
        deductionsBreakdown.push({
          id: 'LATE_FINE',
          name: `Late Arrival Penalties (${lateDays}d)`,
          amount: lateDeductions,
          calcMode: 'FORMULA',
        });
      }

      if (lopDeductions > 0 || (payrollConfig.showLopDays !== false && lopDays > 0)) {
        deductionsBreakdown.push({
          id: 'LOP',
          name: `Loss of Pay / LOP (${lopDays}d)`,
          amount: lopDeductions,
          calcMode: 'FORMULA',
        });
      }

      let customAllowanceTotal = 0;
      let customDeductionTotal = 0;
      let fuelAllowance = 0;

      const customComponents = Array.isArray(payrollConfig.customComponents)
        ? payrollConfig.customComponents
        : [];

      for (const comp of customComponents) {
        if (!comp.enabled) continue;
        let amount = 0;
        if (comp.calcMode === 'FIXED') {
          amount = Number(comp.value || 0);
        } else if (comp.calcMode === 'PERCENTAGE_OF_BASE') {
          amount = Math.round(baseSalary * (Number(comp.value || 0) / 100));
        } else if (comp.calcMode === 'FORMULA') {
          amount = this.evaluateFormula(comp.formula || '', formulaVars);
        }

        if (comp.type === 'EARNING') {
          customAllowanceTotal += amount;
          if (comp.id.toUpperCase().includes('FUEL')) {
            fuelAllowance += amount;
          }
          earningsBreakdown.push({
            id: comp.id,
            name: comp.name,
            amount,
            calcMode: comp.calcMode,
            formula: comp.formula,
          });
        } else {
          customDeductionTotal += amount;
          deductionsBreakdown.push({
            id: comp.id,
            name: comp.name,
            amount,
            calcMode: comp.calcMode,
            formula: comp.formula,
          });
        }
      }

      // Tax Deductions
      const effectiveTaxPercentage =
        emp.taxPercentage !== undefined && emp.taxPercentage !== null
          ? Number(emp.taxPercentage)
          : Number(payrollConfig.defaultTaxPercentage || 0);

      const grossEarnings = Math.max(
        0,
        Math.round(baseSalary + overtimeBonus + customAllowanceTotal),
      );
      const taxDeductions =
        Math.round(grossEarnings * (effectiveTaxPercentage / 100) * 100) / 100;

      if (taxDeductions > 0 || payrollConfig.showTaxBreakdown !== false) {
        deductionsBreakdown.push({
          id: 'INCOME_TAX',
          name: `Income Tax (${effectiveTaxPercentage}%)`,
          amount: taxDeductions,
          calcMode: 'PERCENTAGE_OF_BASE',
        });
      }

      const totalDeductions = Math.max(
        0,
        Math.round(lateDeductions + lopDeductions + taxDeductions + customDeductionTotal),
      );

      const netSalary = Math.max(0, Math.round(grossEarnings - totalDeductions));
      const netPayInWords = this.convertNumberToWords(
        netSalary,
        currency,
        payrollConfig.numberWordsFormat || 'INTERNATIONAL',
      );

      // Password protection & e-Sign stamp
      const isPasswordProtected = Boolean(payrollConfig.passwordProtectPdf);
      const pwdInfo = this.computePdfPassword(
        payrollConfig.pdfPasswordRule,
        emp,
        dto.month,
      );
      const eSignHash = `ESIGN-${dto.month.replace('-', '')}-${createHash('sha256')
        .update(`${tenant.companyId}:${emp.employeeId}:${dto.month}:${netSalary}`)
        .digest('hex')
        .slice(0, 8)
        .toUpperCase()}`;

      const slipId = `slip_${randomUUID()}`;
      const slipData: Partial<PayrollSlip> = {
        companyId: tenant.companyId,
        employeeId: emp.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        employeeEmail: emp.email,
        designation: emp.designation,
        departmentName: emp.departmentName,
        branchName: emp.branchName,
        month: dto.month,
        baseSalary,
        workingDays: standardWorkingDays,
        presentDays,
        absentDays,
        paidLeaveDays,
        unpaidLeaveDays,
        lopDays,
        lopDeductions,
        lateDays,
        overtimeHours,
        lateDeductions,
        taxPercentage: effectiveTaxPercentage,
        taxDeductions,
        overtimeBonus,
        customBonus: 0,
        fuelAllowance,
        otherAllowances: customAllowanceTotal,
        otherDeductions: customDeductionTotal,
        grossEarnings,
        totalDeductions,
        netSalary,
        netPayInWords,
        earningsBreakdown,
        deductionsBreakdown,
        templateVersion: Number(payrollConfig.templateVersion || 1),
        templateSnapshot,
        isPasswordProtected,
        pdfPasswordHint: isPasswordProtected ? pwdInfo.hint : '',
        pdfPassword: isPasswordProtected ? pwdInfo.password : '',
        eSignHash,
        eSignedAt: new Date(),
        status: PayrollSlipStatus.GENERATED,
        bankDetails: emp.bankDetails,
      };

      const savedSlip = await slipModel
        .findOneAndUpdate(
          {
            companyId: tenant.companyId,
            month: dto.month,
            employeeId: emp.employeeId,
          },
          {
            $set: slipData,
            $setOnInsert: { slipId },
          },
          { upsert: true, new: true },
        )
        .lean();

      // Generate PDF buffer and archive to Cloudinary
      try {
        const pdfBuffer = this.generatePdfBuffer(
          savedSlip as unknown as PayrollSlip,
          companyName,
          currency,
        );
        const uploaded = await this.uploadService.uploadAttachment(
          pdfBuffer,
          `Payslip_${emp.employeeId}_${dto.month}.pdf`,
          'application/pdf',
        );
        if (uploaded?.url) {
          savedSlip.pdfUrl = uploaded.url;
          await slipModel.updateOne(
            { slipId: savedSlip.slipId },
            { $set: { pdfUrl: uploaded.url } },
          );
        }
      } catch (err: any) {
        this.logger.warn(`PDF archive skipped for ${emp.employeeId}: ${err.message}`);
      }

      slips.push(savedSlip as unknown as PayrollSlip);
    }

    // Auto-send emails if enabled in company settings or requested in DTO
    let emailedCount = 0;
    if (dto.sendEmails || payrollConfig.autoSendEmail) {
      for (const s of slips) {
        const ok = await this.sendSingleSlipEmail(tenant, s.slipId);
        if (ok.sent) emailedCount++;
      }
    }

    return { generated: slips.length, slips, emailedCount };
  }

  // Allows permission holder to customize bonus, fuel, allowances, deductions & notes for an individual employee slip
  async customizeSlip(
    tenant: TenantContext,
    slipId: string,
    dto: CustomizePayrollSlipDto,
  ): Promise<PayrollSlip> {
    const slipModel = await this.regionalDbManager.getModel<PayrollSlip>(
      tenant.region,
      PayrollSlip.name,
      PayrollSlipSchema,
    );
    const slip = await slipModel.findOne({ companyId: tenant.companyId, slipId }).lean();
    if (!slip) {
      throw new NotFoundException('Payroll slip not found');
    }

    const baseSalary = dto.baseSalary !== undefined ? Number(dto.baseSalary) : slip.baseSalary;
    const overtimeBonus =
      dto.overtimeBonus !== undefined ? Number(dto.overtimeBonus) : slip.overtimeBonus;
    const customBonus =
      dto.customBonus !== undefined ? Number(dto.customBonus) : Number(slip.customBonus || 0);
    const fuelAllowance =
      dto.fuelAllowance !== undefined ? Number(dto.fuelAllowance) : Number(slip.fuelAllowance || 0);
    const otherAllowances =
      dto.otherAllowances !== undefined
        ? Number(dto.otherAllowances)
        : Number(slip.otherAllowances || 0);
    const lateDeductions =
      dto.lateDeductions !== undefined ? Number(dto.lateDeductions) : slip.lateDeductions;
    const lopDeductions =
      dto.lopDeductions !== undefined
        ? Number(dto.lopDeductions)
        : Number(slip.lopDeductions || 0);
    const otherDeductions =
      dto.otherDeductions !== undefined
        ? Number(dto.otherDeductions)
        : Number(slip.otherDeductions || 0);
    const taxDeductions =
      dto.taxDeductions !== undefined
        ? Number(dto.taxDeductions)
        : Number(slip.taxDeductions || 0);

    // Rebuild breakdown arrays if not explicitly provided
    let earningsBreakdown = dto.earningsBreakdown;
    if (!earningsBreakdown) {
      earningsBreakdown = (slip.earningsBreakdown || []).filter(
        (e) => !['BASE', 'OVERTIME', 'MANUAL_BONUS', 'MANUAL_FUEL', 'MANUAL_OTHER_EARNING'].includes(e.id),
      );
      earningsBreakdown.unshift({
        id: 'BASE',
        name: 'Basic Salary',
        amount: baseSalary,
        calcMode: 'FIXED',
      });
      if (overtimeBonus > 0) {
        earningsBreakdown.push({
          id: 'OVERTIME',
          name: `Overtime Compensation (${slip.overtimeHours}h)`,
          amount: overtimeBonus,
          calcMode: 'FORMULA',
        });
      }
      if (customBonus > 0) {
        earningsBreakdown.push({
          id: 'MANUAL_BONUS',
          name: 'Performance / Custom Bonus',
          amount: customBonus,
          calcMode: 'FIXED',
          isManual: true,
        });
      }
      if (fuelAllowance > 0) {
        earningsBreakdown.push({
          id: 'MANUAL_FUEL',
          name: 'Fuel & Conveyance Allowance',
          amount: fuelAllowance,
          calcMode: 'FIXED',
          isManual: true,
        });
      }
      if (otherAllowances > 0) {
        earningsBreakdown.push({
          id: 'MANUAL_OTHER_EARNING',
          name: 'Special / Additional Allowance',
          amount: otherAllowances,
          calcMode: 'FIXED',
          isManual: true,
        });
      }
    }

    let deductionsBreakdown = dto.deductionsBreakdown;
    if (!deductionsBreakdown) {
      deductionsBreakdown = (slip.deductionsBreakdown || []).filter(
        (d) => !['LATE_FINE', 'LOP', 'INCOME_TAX', 'MANUAL_OTHER_DEDUCTION'].includes(d.id),
      );
      if (lateDeductions > 0) {
        deductionsBreakdown.push({
          id: 'LATE_FINE',
          name: `Late Arrival Penalties (${slip.lateDays}d)`,
          amount: lateDeductions,
          calcMode: 'FORMULA',
        });
      }
      if (lopDeductions > 0) {
        deductionsBreakdown.push({
          id: 'LOP',
          name: `Loss of Pay / LOP (${slip.lopDays || 0}d)`,
          amount: lopDeductions,
          calcMode: 'FORMULA',
        });
      }
      if (otherDeductions > 0) {
        deductionsBreakdown.push({
          id: 'MANUAL_OTHER_DEDUCTION',
          name: 'Other / Manual Deduction',
          amount: otherDeductions,
          calcMode: 'FIXED',
          isManual: true,
        });
      }
      if (taxDeductions > 0) {
        deductionsBreakdown.push({
          id: 'INCOME_TAX',
          name: `Income Tax (${slip.taxPercentage || 0}%)`,
          amount: taxDeductions,
          calcMode: 'PERCENTAGE_OF_BASE',
        });
      }
    }

    const grossEarnings = Math.round(
      earningsBreakdown.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    );
    const totalDeductions = Math.round(
      deductionsBreakdown.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    );
    const netSalary = Math.max(0, grossEarnings - totalDeductions);

    const snap = slip.templateSnapshot || {};
    const currency = snap.currency || 'USD';
    const companyName = snap.companyName || 'WorkivLab';
    const netPayInWords = this.convertNumberToWords(
      netSalary,
      currency,
      snap.numberWordsFormat || 'INTERNATIONAL',
    );

    const updatePayload: Partial<PayrollSlip> = {
      baseSalary,
      overtimeBonus,
      customBonus,
      fuelAllowance,
      otherAllowances,
      lateDeductions,
      lopDeductions,
      otherDeductions,
      taxDeductions,
      earningsBreakdown,
      deductionsBreakdown,
      grossEarnings,
      totalDeductions,
      netSalary,
      netPayInWords,
      notes: dto.notes !== undefined ? dto.notes : slip.notes,
    };

    const updated = await slipModel
      .findOneAndUpdate(
        { companyId: tenant.companyId, slipId },
        { $set: updatePayload },
        { new: true },
      )
      .lean();

    if (!updated) {
      throw new NotFoundException('Payroll slip not found');
    }

    // Re-archive updated PDF in Cloudinary
    try {
      const pdfBuffer = this.generatePdfBuffer(
        updated as unknown as PayrollSlip,
        companyName,
        currency,
      );
      const uploaded = await this.uploadService.uploadAttachment(
        pdfBuffer,
        `Payslip_${updated.employeeId}_${updated.month}_rev.pdf`,
        'application/pdf',
      );
      if (uploaded?.url) {
        updated.pdfUrl = uploaded.url;
        await slipModel.updateOne({ slipId }, { $set: { pdfUrl: uploaded.url } });
      }
    } catch {
      // ignore archive error
    }

    return updated as unknown as PayrollSlip;
  }

  // Dispatches salary slip email to a single employee
  async sendSingleSlipEmail(
    tenant: TenantContext,
    slipId: string,
  ): Promise<{ sent: boolean; slip: PayrollSlip }> {
    const slipModel = await this.regionalDbManager.getModel<PayrollSlip>(
      tenant.region,
      PayrollSlip.name,
      PayrollSlipSchema,
    );
    const compModel = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );

    const [slip, company] = await Promise.all([
      slipModel.findOne({ companyId: tenant.companyId, slipId }).lean(),
      compModel.findOne({ companyId: tenant.companyId }).lean(),
    ]);

    if (!slip) {
      throw new NotFoundException('Payroll slip not found');
    }

    const snap = slip.templateSnapshot || {};
    const companyName = snap.companyName || company?.name || 'WorkivLab';
    const currency = snap.currency || company?.currency || 'USD';
    const pdfBuffer = this.generatePdfBuffer(
      slip as unknown as PayrollSlip,
      companyName,
      currency,
    );

    const sent = await this.mailService.sendSalarySlipEmail(slip.employeeEmail, {
      employeeName: slip.employeeName,
      companyName,
      month: slip.month,
      currency,
      grossEarnings: slip.grossEarnings ?? slip.baseSalary + slip.overtimeBonus,
      totalDeductions:
        slip.totalDeductions ?? slip.lateDeductions + (slip.taxDeductions || 0),
      netSalary: slip.netSalary,
      netPayInWords:
        slip.netPayInWords || this.convertNumberToWords(slip.netSalary, currency),
      presentDays: slip.presentDays,
      workingDays: slip.workingDays,
      paidLeaveDays: slip.paidLeaveDays || 0,
      lopDays: slip.lopDays || 0,
      slipHtmlUrl: `http://localhost:4000/api/v1/payroll/slips/${slip.slipId}/html`,
      pdfUrl: slip.pdfUrl,
      isPasswordProtected: slip.isPasswordProtected,
      pdfPasswordHint: slip.pdfPasswordHint,
      pdfBuffer,
    });

    const updated = await slipModel
      .findOneAndUpdate(
        { companyId: tenant.companyId, slipId },
        {
          $set: {
            emailSent: sent,
            emailSentAt: new Date(),
          },
        },
        { new: true },
      )
      .lean();

    return { sent, slip: (updated || slip) as unknown as PayrollSlip };
  }

  // Bulk emails all salary slips for a given month
  async sendBulkSlipEmails(
    tenant: TenantContext,
    dto: BulkEmailPayrollDto,
  ): Promise<{ total: number; sent: number }> {
    const slips = await this.findAll(tenant, dto.month);
    const targetSlips =
      dto.slipIds && dto.slipIds.length > 0
        ? slips.filter((s) => dto.slipIds!.includes(s.slipId))
        : slips;

    let sent = 0;
    for (const s of targetSlips) {
      const res = await this.sendSingleSlipEmail(tenant, s.slipId);
      if (res.sent) sent++;
    }
    return { total: targetSlips.length, sent };
  }

  async updateStatus(
    tenant: TenantContext,
    slipId: string,
    dto: UpdateSlipStatusDto,
  ): Promise<PayrollSlip> {
    const slipModel = await this.regionalDbManager.getModel<PayrollSlip>(
      tenant.region,
      PayrollSlip.name,
      PayrollSlipSchema,
    );

    const updateData: any = { status: dto.status };
    if (dto.status === PayrollSlipStatus.PAID) {
      updateData.paidAt = new Date();
    }
    if (dto.notes) {
      updateData.notes = dto.notes;
    }

    const slip = await slipModel
      .findOneAndUpdate(
        { companyId: tenant.companyId, slipId },
        { $set: updateData },
        { new: true },
      )
      .lean();

    if (!slip) {
      throw new NotFoundException('Payroll slip not found');
    }

    return slip;
  }

  // Generates live HTML preview for Company Settings Salary Slip Studio before saving
  async generatePreviewHtml(
    tenant: TenantContext,
    dto: PreviewPayrollHtmlDto,
  ): Promise<{ html: string }> {
    const compModel = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );
    const company = await compModel.findOne({ companyId: tenant.companyId }).lean();
    const cfg: any = {
      ...(company?.payrollConfig || {}),
      ...(dto.payrollConfigOverride || dto.templateConfig || {}),
    };

    const currency = company?.currency || 'USD';
    const sampleBase = 5000;
    const sampleVars = {
      BASE: sampleBase,
      DAILY_RATE: sampleBase / (cfg.standardWorkingDays || 22),
      HOURLY_RATE: sampleBase / ((cfg.standardWorkingDays || 22) * 8),
      WORKING_DAYS: Number(cfg.standardWorkingDays || 22),
      PRESENT_DAYS: 20,
      PAID_LEAVES: 1,
      LOP_DAYS: 1,
      LATE_DAYS: 1,
      OVERTIME_HOURS: 6,
    };

    const earningsBreakdown: any[] = [
      { id: 'BASE', name: 'Basic Salary', amount: sampleBase },
    ];
    if (cfg.showOvertimeHours !== false) {
      earningsBreakdown.push({
        id: 'OVERTIME',
        name: 'Overtime Compensation (6h)',
        amount: 255,
      });
    }

    const deductionsBreakdown: any[] = [];
    if (cfg.showLateArrivals !== false) {
      deductionsBreakdown.push({
        id: 'LATE_FINE',
        name: 'Late Arrival Penalties (1d)',
        amount: 45,
      });
    }
    if (cfg.showLopDays !== false && cfg.enableLopDeduction !== false) {
      deductionsBreakdown.push({
        id: 'LOP',
        name: 'Loss of Pay / LOP (1d)',
        amount: 227,
      });
    }

    const customComponents = Array.isArray(cfg.customComponents)
      ? cfg.customComponents
      : [];
    for (const comp of customComponents) {
      if (!comp.enabled) continue;
      let amount = 0;
      if (comp.calcMode === 'FIXED') amount = Number(comp.value || 0);
      else if (comp.calcMode === 'PERCENTAGE_OF_BASE')
        amount = Math.round(sampleBase * (Number(comp.value || 0) / 100));
      else if (comp.calcMode === 'FORMULA')
        amount = this.evaluateFormula(comp.formula || '', sampleVars);

      if (comp.type === 'EARNING') {
        earningsBreakdown.push({ id: comp.id, name: comp.name, amount });
      } else {
        deductionsBreakdown.push({ id: comp.id, name: comp.name, amount });
      }
    }

    const grossEarnings = earningsBreakdown.reduce((s, i) => s + Number(i.amount || 0), 0);
    const taxPct = Number(cfg.defaultTaxPercentage || 5);
    const taxAmt = Math.round(grossEarnings * (taxPct / 100));
    if (cfg.showTaxBreakdown !== false) {
      deductionsBreakdown.push({
        id: 'INCOME_TAX',
        name: `Income Tax (${taxPct}%)`,
        amount: taxAmt,
      });
    }
    const totalDeductions = deductionsBreakdown.reduce(
      (s, i) => s + Number(i.amount || 0),
      0,
    );
    const netSalary = Math.max(0, grossEarnings - totalDeductions);

    const mockSlip: any = {
      slipId: 'slip_preview_demo',
      employeeId: 'EMP-1042',
      employeeName: 'Alex Morgan (Preview)',
      employeeEmail: 'alex.morgan@company.com',
      designation: 'Senior Product Engineer',
      departmentName: 'Engineering & Product',
      branchName: 'Global Headquarters',
      month: new Date().toISOString().slice(0, 7),
      baseSalary: sampleBase,
      workingDays: Number(cfg.standardWorkingDays || 22),
      presentDays: 20,
      absentDays: 1,
      paidLeaveDays: 1,
      unpaidLeaveDays: 1,
      lopDays: 1,
      lopDeductions: 227,
      lateDays: 1,
      overtimeHours: 6,
      lateDeductions: 45,
      taxPercentage: taxPct,
      taxDeductions: taxAmt,
      overtimeBonus: 255,
      grossEarnings,
      totalDeductions,
      netSalary,
      netPayInWords: this.convertNumberToWords(
        netSalary,
        currency,
        cfg.numberWordsFormat || 'INTERNATIONAL',
      ),
      earningsBreakdown,
      deductionsBreakdown,
      templateVersion: Number(cfg.templateVersion || 1),
      templateSnapshot: {
        ...cfg,
        companyName: company?.name || 'WorkivLab',
        companyLogoUrl: company?.logoUrl || '',
        companyAddress: company?.address || '',
        currency,
      },
      isPasswordProtected: false,
      eSignHash: 'ESIGN-2026-9F8A4C2E',
      eSignedAt: new Date(),
      status: PayrollSlipStatus.PAID,
      paidAt: new Date(),
      bankDetails: {
        bankName: 'Standard Chartered Corporate Bank',
        accountTitle: 'Alex Morgan',
        accountNumber: '**** **** 8842',
        iban: 'PK36SCBL0000001123458842',
      },
    };

    const html = this.renderSlipHtmlDocument(mockSlip, company, currency, true);
    return { html };
  }

  async generateHtmlSlip(tenant: TenantContext, slipId: string): Promise<string> {
    const slip = await this.findOne(tenant, slipId);
    const compModel = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );
    const empModel = await this.regionalDbManager.getModel<Employee>(
      tenant.region,
      Employee.name,
      EmployeeSchema,
    );
    const [company, emp] = await Promise.all([
      compModel.findOne({ companyId: tenant.companyId }).lean(),
      empModel
        .findOne({ companyId: tenant.companyId, employeeId: slip.employeeId })
        .lean(),
    ]);
    let branchCurrency: string | undefined;
    if (emp?.branchId) {
      const branchModel = await this.regionalDbManager.getModel<Branch>(
        tenant.region,
        Branch.name,
        BranchSchema,
      );
      const branch = await branchModel
        .findOne({ companyId: tenant.companyId, branchId: emp.branchId })
        .lean();
      branchCurrency = branch?.currency;
    }
    const currency =
      slip.templateSnapshot?.currency || branchCurrency || company?.currency || 'USD';

    return this.renderSlipHtmlDocument(slip, company, currency, false);
  }

  private renderSlipHtmlDocument(
    slip: PayrollSlip,
    company: any,
    currency: string,
    isPreviewMode = false,
  ): string {
    // Versioned template: use snapshot saved on slip if available, fallback to current company config
    const cfg: any = {
      ...(company?.payrollConfig || {}),
      ...(slip.templateSnapshot || {}),
    };

    const companyName = cfg.companyName || company?.name || 'WorkivLab';
    const companyLogo = cfg.companyLogoUrl ?? company?.logoUrl ?? '';
    const primaryColor = cfg.primaryColor || '#2A65F6';
    const layout = cfg.templateLayout || 'MODERN_EXECUTIVE';
    const headerTitle = cfg.headerTitle || 'SALARY SLIP';
    const headerSubtitle =
      cfg.headerSubtitle || 'Official Monthly Remuneration Statement';
    const headerCustomNote = cfg.headerCustomNote || company?.address || '';
    const headerAlign = cfg.headerAlignment || 'SPLIT';
    const footerText =
      cfg.footerText ||
      `This is a computer-generated document issued by ${companyName}.`;
    const footerDisclaimer =
      cfg.footerDisclaimer || 'Confidential — For Authorized Recipient Only';

    const earnings =
      slip.earningsBreakdown && slip.earningsBreakdown.length > 0
        ? slip.earningsBreakdown
        : [
            { id: 'BASE', name: 'Basic Salary', amount: slip.baseSalary },
            {
              id: 'OVERTIME',
              name: `Overtime Compensation (${slip.overtimeHours}h)`,
              amount: slip.overtimeBonus,
            },
          ];

    const deductions =
      slip.deductionsBreakdown && slip.deductionsBreakdown.length > 0
        ? slip.deductionsBreakdown
        : [
            {
              id: 'LATE_FINE',
              name: `Late Arrival Penalties (${slip.lateDays}d)`,
              amount: slip.lateDeductions,
            },
            ...(slip.lopDeductions
              ? [
                  {
                    id: 'LOP',
                    name: `Loss of Pay / LOP (${slip.lopDays || 0}d)`,
                    amount: slip.lopDeductions,
                  },
                ]
              : []),
            {
              id: 'INCOME_TAX',
              name: `Income Tax (${slip.taxPercentage || 0}%)`,
              amount: slip.taxDeductions || 0,
            },
          ];

    const grossEarnings =
      slip.grossEarnings ??
      earnings.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalDeductions =
      slip.totalDeductions ??
      deductions.reduce((s, d) => s + Number(d.amount || 0), 0);
    const netWords =
      slip.netPayInWords ||
      this.convertNumberToWords(
        slip.netSalary,
        currency,
        cfg.numberWordsFormat || 'INTERNATIONAL',
      );

    const maxRows = Math.max(earnings.length, deductions.length);
    let tableRowsHtml = '';
    for (let i = 0; i < maxRows; i++) {
      const earn = earnings[i];
      const ded = deductions[i];
      tableRowsHtml += `
        <tr>
          <td>${earn ? earn.name : ''}</td>
          <td class="text-right font-semibold" style="color: #0f172a;">${
            earn ? Number(earn.amount || 0).toLocaleString() : ''
          }</td>
          <td>${ded ? ded.name : ''}</td>
          <td class="text-right font-semibold" style="color: #ef4444;">${
            ded ? '-' + Number(ded.amount || 0).toLocaleString() : ''
          }</td>
        </tr>`;
    }

    const layoutSpecificStyles =
      layout === 'CLASSIC_CORPORATE'
        ? `
          .payslip-box { border: 2px solid #0f172a; border-radius: 4px; padding: 32px; }
          .header { border-bottom: 3px double #0f172a; }
          table, th, td { border: 1px solid #cbd5e1; }
          th { background: #1e293b; color: #ffffff; }
          .net-pay-banner { background: #0f172a; border-radius: 4px; }
        `
        : layout === 'MINIMAL_COMPACT'
          ? `
          .payslip-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 24px; box-shadow: none; }
          .header { border-bottom: 1px solid #cbd5e1; padding-bottom: 14px; margin-bottom: 16px; }
          .info-card { background: transparent; border: none; border-left: 3px solid ${primaryColor}; border-radius: 0; padding: 6px 12px; }
          .net-pay-banner { background: #f8fafc; color: #0f172a; border: 2px solid ${primaryColor}; border-radius: 6px; }
          .net-pay-amount { color: ${primaryColor}; }
        `
          : '';

    const passwordLockHtml =
      !isPreviewMode && slip.isPasswordProtected && slip.pdfPassword
        ? `
      <div id="pwd-overlay" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.92); backdrop-filter: blur(8px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div style="background: #ffffff; max-width: 400px; width: 100%; border-radius: 12px; padding: 28px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.25);">
          <div style="width: 48px; height: 48px; background: #eff6ff; color: ${primaryColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto; font-size: 22px;">🔒</div>
          <h3 style="margin: 0 0 6px 0; font-size: 18px; color: #0f172a;">Password Protected Payslip</h3>
          <p style="margin: 0 0 16px 0; font-size: 12px; color: #64748b; line-height: 1.5;">
            ${slip.pdfPasswordHint || 'Enter your employee security password to unlock this salary slip.'}
          </p>
          <input id="pwd-input" type="password" placeholder="Enter password..." style="width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; margin-bottom: 10px; text-align: center;" />
          <div id="pwd-err" style="color: #ef4444; font-size: 12px; margin-bottom: 10px; display: none;">Incorrect password. Please try again.</div>
          <button onclick="unlockSlip()" style="width: 100%; background: ${primaryColor}; color: #ffffff; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer;">Unlock Salary Slip</button>
        </div>
      </div>
      <script>
        function unlockSlip() {
          var val = document.getElementById('pwd-input').value.trim().toUpperCase();
          if (val === '${slip.pdfPassword.toUpperCase()}') {
            document.getElementById('pwd-overlay').style.display = 'none';
          } else {
            document.getElementById('pwd-err').style.display = 'block';
          }
        }
      </script>
    `
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${slip.employeeName} (${slip.month})</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: ${isPreviewMode ? 'transparent' : '#f8fafc'};
      margin: 0;
      padding: ${isPreviewMode ? '8px' : '28px'};
    }
    .payslip-box {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 34px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    }
    .header {
      display: flex;
      flex-direction: ${headerAlign === 'CENTERED' ? 'column' : 'row'};
      justify-content: ${headerAlign === 'CENTERED' ? 'center' : 'space-between'};
      align-items: ${headerAlign === 'LEFT' ? 'flex-start' : 'center'};
      text-align: ${headerAlign === 'CENTERED' ? 'center' : 'left'};
      border-bottom: 2px solid ${primaryColor};
      padding-bottom: 18px;
      margin-bottom: 22px;
      gap: 14px;
    }
    .brand-row {
      display: flex;
      align-items: center;
      gap: 14px;
      ${headerAlign === 'CENTERED' ? 'justify-content: center;' : ''}
    }
    .company-logo {
      width: 48px;
      height: 48px;
      object-fit: contain;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .company-title {
      font-size: 22px;
      font-weight: 800;
      color: ${primaryColor};
      letter-spacing: -0.5px;
    }
    .payslip-badge {
      background: ${primaryColor}15;
      color: ${primaryColor};
      font-weight: 800;
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 8px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      border: 1px solid ${primaryColor}35;
    }
    .grid {
      display: grid;
      grid-template-columns: ${cfg.showAttendanceSummary !== false ? 'repeat(2, 1fr)' : '1fr'};
      gap: 18px;
      margin-bottom: 24px;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
    }
    .info-card h4 {
      margin: 0 0 10px 0;
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 12.5px;
    }
    .info-label { color: #64748b; }
    .info-value { font-weight: 600; color: #0f172a; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 22px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      text-align: left;
    }
    td {
      padding: 10px 12px;
      font-size: 13px;
      border-bottom: 1px solid #f1f5f9;
    }
    .text-right { text-align: right; }
    .font-semibold { font-weight: 600; }
    .net-pay-banner {
      background: ${primaryColor};
      color: #ffffff;
      border-radius: 10px;
      padding: 18px 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }
    .net-pay-title { font-size: 15px; font-weight: 700; }
    .net-pay-amount { font-size: 26px; font-weight: 800; }
    .words-bar {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 12.5px;
      color: #334155;
      margin-bottom: 20px;
    }
    .sig-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
    }
    .esign-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #047857;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    .footer-note {
      text-align: center;
      font-size: 11.5px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      margin-top: 20px;
    }
    .print-btn-bar {
      display: ${isPreviewMode ? 'none' : 'flex'};
      justify-content: space-between;
      align-items: center;
      max-width: 820px;
      margin: 0 auto 14px auto;
    }
    .btn-print {
      background: ${primaryColor};
      color: white;
      border: none;
      padding: 9px 18px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
    }
    ${layoutSpecificStyles}
    @media print {
      body { background: #fff; padding: 0; }
      .print-btn-bar, #pwd-overlay { display: none !important; }
      .payslip-box { border: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  ${passwordLockHtml}
  <div class="print-btn-bar">
    <span style="font-size: 12px; color: #64748b; font-weight: 600;">Template Version: v${slip.templateVersion || 1} (${layout})</span>
    <div style="display: flex; gap: 8px;">
      ${
        slip.pdfUrl
          ? `<a href="${slip.pdfUrl}" target="_blank" style="text-decoration: none; background: #0f172a; color: #fff; padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;">Cloud PDF</a>`
          : ''
      }
      <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
    </div>
  </div>

  <div class="payslip-box">
    <div class="header">
      <div class="brand-row">
        ${
          cfg.showCompanyLogo !== false && companyLogo
            ? `<img src="${companyLogo}" alt="Logo" class="company-logo" />`
            : ''
        }
        <div>
          <div class="company-title">${companyName}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${headerSubtitle}</div>
          ${
            headerCustomNote
              ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${headerCustomNote}</div>`
              : ''
          }
        </div>
      </div>
      <div>
        <div class="payslip-badge">${headerTitle}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 6px; font-weight: 600; text-align: right;">Period: ${slip.month}</div>
      </div>
    </div>

    <div class="grid">
      <div class="info-card">
        <h4>Employee Details</h4>
        <div class="info-row"><span class="info-label">Full Name:</span><span class="info-value">${slip.employeeName}</span></div>
        ${
          cfg.showEmployeeId !== false
            ? `<div class="info-row"><span class="info-label">Employee ID:</span><span class="info-value">${slip.employeeId}</span></div>`
            : ''
        }
        ${
          cfg.showDesignation !== false
            ? `<div class="info-row"><span class="info-label">Designation:</span><span class="info-value">${slip.designation || 'Staff'}</span></div>`
            : ''
        }
        ${
          cfg.showDepartment !== false
            ? `<div class="info-row"><span class="info-label">Department:</span><span class="info-value">${slip.departmentName || 'General'}</span></div>`
            : ''
        }
        ${
          cfg.showBranch !== false
            ? `<div class="info-row"><span class="info-label">Branch:</span><span class="info-value">${slip.branchName || 'Headquarters'}</span></div>`
            : ''
        }
      </div>

      ${
        cfg.showAttendanceSummary !== false
          ? `<div class="info-card">
              <h4>Attendance & Leave Integration</h4>
              <div class="info-row"><span class="info-label">Standard Working Days:</span><span class="info-value">${slip.workingDays} days</span></div>
              <div class="info-row"><span class="info-label">Present Days:</span><span class="info-value" style="color: #10b981;">${slip.presentDays} days</span></div>
              ${
                cfg.showPaidLeaves !== false
                  ? `<div class="info-row"><span class="info-label">Approved Paid Leaves:</span><span class="info-value" style="color: #2A65F6;">${slip.paidLeaveDays || 0} days</span></div>`
                  : ''
              }
              ${
                cfg.showLopDays !== false
                  ? `<div class="info-row"><span class="info-label">Loss of Pay (LOP / Absent):</span><span class="info-value" style="color: #ef4444;">${slip.lopDays || 0} days</span></div>`
                  : ''
              }
              ${
                cfg.showLateArrivals !== false
                  ? `<div class="info-row"><span class="info-label">Late Arrivals:</span><span class="info-value">${slip.lateDays} days</span></div>`
                  : ''
              }
              ${
                cfg.showOvertimeHours !== false
                  ? `<div class="info-row"><span class="info-label">Overtime Logged:</span><span class="info-value">${slip.overtimeHours} hrs</span></div>`
                  : ''
              }
            </div>`
          : ''
      }
    </div>

    <table>
      <thead>
        <tr>
          <th>Earnings & Allowances</th>
          <th class="text-right">Amount (${currency})</th>
          <th>Deductions & Recoveries</th>
          <th class="text-right">Amount (${currency})</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
        <tr style="font-weight: 800; background: #f8fafc;">
          <td>Total Gross Earnings</td>
          <td class="text-right" style="color: #10b981;">${currency} ${grossEarnings.toLocaleString()}</td>
          <td>Total Deductions</td>
          <td class="text-right" style="color: #ef4444;">-${currency} ${totalDeductions.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <div class="net-pay-banner">
      <div>
        <div class="net-pay-title">Net Payable Take-Home Salary</div>
        <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">
          Disbursement Status: ${slip.status} ${
            slip.paidAt ? `• Paid on ${new Date(slip.paidAt).toLocaleDateString()}` : ''
          }
        </div>
      </div>
      <div class="net-pay-amount">${currency} ${slip.netSalary.toLocaleString()}</div>
    </div>

    ${
      cfg.showNetPayInWords !== false
        ? `<div class="words-bar">
            <strong>Net Pay in Words:</strong> ${netWords}
          </div>`
        : ''
    }

    ${
      cfg.showBankDetails !== false && slip.bankDetails?.bankName
        ? `<div class="info-card" style="margin-bottom: 18px;">
            <h4>Disbursement Bank Account</h4>
            <div class="info-row"><span class="info-label">Bank Name:</span><span class="info-value">${slip.bankDetails.bankName}</span></div>
            <div class="info-row"><span class="info-label">Account Title:</span><span class="info-value">${slip.bankDetails.accountTitle || slip.employeeName}</span></div>
            <div class="info-row"><span class="info-label">Account Number:</span><span class="info-value">${slip.bankDetails.accountNumber || '—'}</span></div>
            ${
              slip.bankDetails.iban
                ? `<div class="info-row"><span class="info-label">IBAN:</span><span class="info-value">${slip.bankDetails.iban}</span></div>`
                : ''
            }
          </div>`
        : ''
    }

    ${
      slip.notes
        ? `<div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #92400e; margin-bottom: 16px;">
            <strong>HR / Payroll Remarks:</strong> ${slip.notes}
          </div>`
        : ''
    }

    ${
      cfg.showSignature !== false || cfg.enableESignStamp !== false
        ? `<div class="sig-row">
            <div>
              ${
                cfg.enableESignStamp !== false && slip.eSignHash
                  ? `<div class="esign-badge">
                      <span>✓ Digitally e-Signed & Verified</span>
                      <span style="font-family: monospace; opacity: 0.85;">(${slip.eSignHash})</span>
                    </div>`
                  : ''
              }
            </div>
            ${
              cfg.showSignature !== false
                ? `<div style="text-align: right;">
                    ${
                      cfg.signatureImageUrl
                        ? `<img src="${cfg.signatureImageUrl}" alt="Signature" style="max-height: 46px; object-fit: contain; display: block; margin-left: auto; margin-bottom: 4px;" />`
                        : `<div style="font-family: 'Brush Script MT', cursive, serif; font-size: 20px; color: #1e293b; margin-bottom: 4px;">${cfg.signatoryName || 'Authorized Signatory'}</div>`
                    }
                    <div style="border-top: 1px solid #94a3b8; padding-top: 4px; min-width: 180px;">
                      <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${cfg.signatoryName || 'Authorized Signatory'}</div>
                      <div style="font-size: 11px; color: #64748b;">${cfg.signatoryTitle || 'Head of HR & Finance'}</div>
                    </div>
                  </div>`
                : ''
            }
          </div>`
        : ''
    }

    <div class="footer-note">
      <div>${footerText}</div>
      <div style="font-weight: 600; margin-top: 3px; font-size: 10.5px;">${footerDisclaimer}</div>
    </div>
  </div>
</body>
</html>`;
  }
}
