import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseStatusDto } from './dto/expense.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import {
  CurrentTenant,
  TenantContext,
} from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { JwtPayload } from '../auth/jwt.strategy';
import { Expense } from './schemas/expense.schema';

@ApiTags('Accountant & Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.EXPENSES_VIEW)
  @ApiOperation({ summary: 'List company expenses with filters' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Query('branchId') branchId?: string,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Expense[]> {
    return this.expensesService.findAll(tenant, user, {
      branchId,
      category,
      startDate,
      endDate,
    });
  }

  @Get('summary')
  @RequirePermissions(PERMISSIONS.EXPENSES_VIEW)
  @ApiOperation({ summary: 'Get total expense metrics, category breakdown, and branch rollup' })
  async getSummary(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expensesService.getSummary(tenant, user);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.EXPENSES_CREATE)
  @ApiOperation({ summary: 'Record a new daily expense or receipt' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateExpenseDto,
  ): Promise<Expense> {
    return this.expensesService.create(tenant, user, dto);
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.EXPENSES_CREATE)
  @ApiOperation({ summary: 'Approve, reimburse, or reject expense' })
  async updateStatus(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseStatusDto,
  ): Promise<Expense> {
    return this.expensesService.updateStatus(tenant, user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.EXPENSES_DELETE)
  @ApiOperation({ summary: 'Delete an expense record' })
  async delete(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.expensesService.delete(tenant, id);
  }
}
