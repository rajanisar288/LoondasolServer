import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ResignationsService } from './resignations.service';
import {
  SubmitResignationDto,
  UpdateClearanceChecklistDto,
  UpdateResignationStatusDto,
} from './dto/resignation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import {
  CurrentTenant,
  TenantContext,
} from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Resignation } from './schemas/resignation.schema';

@ApiTags('Resignations & Exit Clearance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('resignations')
export class ResignationsController {
  constructor(private readonly resignationsService: ResignationsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.RESIGNATIONS_VIEW)
  @ApiOperation({ summary: 'List resignations (HR sees all, employee sees own)' })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
  ): Promise<Resignation[]> {
    return this.resignationsService.findAll(tenant, user);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.RESIGNATIONS_VIEW)
  @ApiOperation({ summary: 'Get single resignation details' })
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<Resignation> {
    return this.resignationsService.findOne(tenant, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.RESIGNATIONS_SUBMIT)
  @ApiOperation({ summary: 'Submit an employee resignation request' })
  async submit(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SubmitResignationDto,
  ): Promise<Resignation> {
    return this.resignationsService.submit(tenant, user, dto);
  }

  @Patch(':id/clearance')
  @RequirePermissions(PERMISSIONS.RESIGNATIONS_APPROVE)
  @ApiOperation({ summary: 'Update exit clearance checklist items' })
  async updateClearance(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateClearanceChecklistDto,
  ): Promise<Resignation> {
    return this.resignationsService.updateClearance(tenant, user, id, dto);
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.RESIGNATIONS_APPROVE)
  @ApiOperation({ summary: 'Update resignation status (APPROVED / REJECTED / COMPLETED)' })
  async updateStatus(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateResignationStatusDto,
  ): Promise<Resignation> {
    return this.resignationsService.updateStatus(tenant, user, id, dto);
  }
}
