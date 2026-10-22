import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import {
  CurrentTenant,
  TenantContext,
} from '../../common/decorators/current-tenant.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Branch } from './schemas/branch.schema';

@ApiTags('Branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.BRANCHES_VIEW)
  @ApiOperation({ summary: 'List all company branches' })
  async findAll(@CurrentTenant() tenant: TenantContext): Promise<Branch[]> {
    return this.branchesService.findAll(tenant);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.BRANCHES_VIEW)
  @ApiOperation({ summary: 'Get branch by ID' })
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<Branch> {
    return this.branchesService.findOne(tenant, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.BRANCHES_CREATE)
  @ApiOperation({ summary: 'Create a new branch' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateBranchDto,
  ): Promise<Branch> {
    return this.branchesService.create(tenant, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.BRANCHES_UPDATE)
  @ApiOperation({ summary: 'Update a branch' })
  async update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
  ): Promise<Branch> {
    return this.branchesService.update(tenant, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.BRANCHES_DELETE)
  @ApiOperation({ summary: 'Delete a branch' })
  async delete(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.branchesService.delete(tenant, id);
  }
}
