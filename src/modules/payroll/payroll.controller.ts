import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import {
  GeneratePayrollDto,
  UpdateSlipStatusDto,
  CustomizePayrollSlipDto,
  BulkEmailPayrollDto,
  PreviewPayrollHtmlDto,
} from './dto/payroll.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import {
  CurrentTenant,
  TenantContext,
} from '../../common/decorators/current-tenant.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { PayrollSlip } from './schemas/payroll-slip.schema';

@ApiTags('Payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('slips')
  @RequirePermissions(PERMISSIONS.PAYROLL_VIEW)
  @ApiOperation({ summary: 'List payroll slips with optional month & employee filter' })
  @ApiQuery({ name: 'month', required: false, example: '2026-09' })
  @ApiQuery({ name: 'employeeId', required: false })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query('month') month?: string,
    @Query('employeeId') employeeId?: string,
  ): Promise<PayrollSlip[]> {
    return this.payrollService.findAll(tenant, month, employeeId);
  }

  @Get('slips/:id')
  @RequirePermissions(PERMISSIONS.PAYROLL_VIEW)
  @ApiOperation({ summary: 'Get single payroll slip' })
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<PayrollSlip> {
    return this.payrollService.findOne(tenant, id);
  }

  @Get('slips/:id/html')
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Get print-ready / PDF HTML format of salary slip' })
  async getHtmlSlip(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<string> {
    return this.payrollService.generateHtmlSlip(tenant, id);
  }

  @Post('preview-html')
  @ApiOperation({ summary: 'Render live HTML preview for Salary Slip Studio in settings' })
  async previewHtml(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: PreviewPayrollHtmlDto,
  ): Promise<{ html: string }> {
    return this.payrollService.generatePreviewHtml(tenant, dto);
  }

  @Post('generate')
  @RequirePermissions(PERMISSIONS.PAYROLL_GENERATE)
  @ApiOperation({ summary: 'Generate monthly payroll slips, archive PDFs in Cloudinary, and optionally email' })
  async generate(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: GeneratePayrollDto,
  ): Promise<{ generated: number; slips: PayrollSlip[]; emailedCount?: number }> {
    return this.payrollService.generatePayroll(tenant, dto);
  }

  @Patch('slips/:id/customize')
  @RequirePermissions(PERMISSIONS.PAYROLL_UPDATE)
  @ApiOperation({ summary: 'Customize individual salary slip (bonus, fuel, allowances, deductions, notes)' })
  async customizeSlip(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: CustomizePayrollSlipDto,
  ): Promise<PayrollSlip> {
    return this.payrollService.customizeSlip(tenant, id, dto);
  }

  @Post('slips/:id/send-email')
  @RequirePermissions(PERMISSIONS.PAYROLL_UPDATE)
  @ApiOperation({ summary: 'Send salary slip email with PDF attachment to an individual employee' })
  async sendSingleEmail(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<{ sent: boolean; slip: PayrollSlip }> {
    return this.payrollService.sendSingleSlipEmail(tenant, id);
  }

  @Post('send-bulk-email')
  @RequirePermissions(PERMISSIONS.PAYROLL_GENERATE)
  @ApiOperation({ summary: 'Bulk send salary slip emails to all employees for a selected month' })
  async sendBulkEmail(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: BulkEmailPayrollDto,
  ): Promise<{ total: number; sent: number }> {
    return this.payrollService.sendBulkSlipEmails(tenant, dto);
  }

  @Patch('slips/:id/status')
  @RequirePermissions(PERMISSIONS.PAYROLL_UPDATE)
  @ApiOperation({ summary: 'Update payroll slip status (PAID/CANCELLED)' })
  async updateStatus(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateSlipStatusDto,
  ): Promise<PayrollSlip> {
    return this.payrollService.updateStatus(tenant, id, dto);
  }
}
