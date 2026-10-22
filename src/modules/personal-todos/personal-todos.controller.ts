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
import { PersonalTodosService } from './personal-todos.service';
import {
  CreatePersonalTodoDto,
  UpdatePersonalTodoDto,
} from './dto/personal-todo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import {
  CurrentTenant,
  TenantContext,
} from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { PersonalTodo } from './schemas/personal-todo.schema';

@ApiTags('Personal Todos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('personal-todos')
export class PersonalTodosController {
  constructor(private readonly todosService: PersonalTodosService) {}

  @Get()
  @ApiOperation({ summary: 'List current user personal todos' })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
  ): Promise<PersonalTodo[]> {
    return this.todosService.findAll(tenant, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a personal todo' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePersonalTodoDto,
  ): Promise<PersonalTodo> {
    return this.todosService.create(tenant, user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a personal todo' })
  async update(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePersonalTodoDto,
  ): Promise<PersonalTodo> {
    return this.todosService.update(tenant, user, id, dto);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start or resume timer for personal todo' })
  async startTimer(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<PersonalTodo> {
    return this.todosService.startTimer(tenant, user, id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause timer for personal todo' })
  async pauseTimer(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<PersonalTodo> {
    return this.todosService.pauseTimer(tenant, user, id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete personal todo' })
  async complete(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<PersonalTodo> {
    return this.todosService.complete(tenant, user, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete personal todo' })
  async delete(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.todosService.delete(tenant, user, id);
  }
}
