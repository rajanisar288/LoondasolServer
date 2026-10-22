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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  CreateSubtaskDto,
  UpdateSubtaskDto,
  CreateCommentDto,
  CreateReplyDto,
  ToggleReactionDto,
} from './dto/task.dto';
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
import { Task, TaskStatus } from './schemas/task.schema';
import { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Tasks & Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.TASKS_VIEW)
  @ApiOperation({
    summary: 'List company tasks with optional status and assignee filter',
  })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: TaskStatus,
    @Query('assigneeId') assigneeId?: string,
  ): Promise<Task[]> {
    return this.tasksService.findAll(tenant, user, { status, assigneeId });
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.TASKS_VIEW)
  @ApiOperation({ summary: 'Get single task by ID' })
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<Task> {
    return this.tasksService.findOne(tenant, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.TASKS_CREATE)
  @ApiOperation({ summary: 'Create a new task' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTaskDto,
  ): Promise<Task> {
    return this.tasksService.create(tenant, user, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.TASKS_UPDATE)
  @ApiOperation({ summary: 'Update a task' })
  async update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasksService.update(tenant, id, dto);
  }

  @Post(':id/subtasks')
  @RequirePermissions(PERMISSIONS.TASKS_UPDATE)
  @ApiOperation({ summary: 'Add a subtask to task' })
  async addSubtask(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: CreateSubtaskDto,
  ): Promise<Task> {
    return this.tasksService.addSubtask(tenant, id, dto);
  }

  @Patch(':id/subtasks/:subtaskId')
  @RequirePermissions(PERMISSIONS.TASKS_UPDATE)
  @ApiOperation({ summary: 'Update or toggle subtask' })
  async updateSubtask(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Param('subtaskId') subtaskId: string,
    @Body() dto: UpdateSubtaskDto,
  ): Promise<Task> {
    return this.tasksService.updateSubtask(tenant, id, subtaskId, dto);
  }

  @Delete(':id/subtasks/:subtaskId')
  @RequirePermissions(PERMISSIONS.TASKS_UPDATE)
  @ApiOperation({ summary: 'Delete a subtask' })
  async deleteSubtask(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Param('subtaskId') subtaskId: string,
  ): Promise<Task> {
    return this.tasksService.deleteSubtask(tenant, id, subtaskId);
  }

  @Post(':id/comments')
  @RequirePermissions(PERMISSIONS.TASKS_VIEW)
  @ApiOperation({ summary: 'Add a comment to task discussion' })
  async addComment(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ): Promise<Task> {
    return this.tasksService.addComment(tenant, user, id, dto);
  }

  @Delete(':id/comments/:commentId')
  @RequirePermissions(PERMISSIONS.TASKS_VIEW)
  @ApiOperation({ summary: 'Delete a comment from task' })
  async deleteComment(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ): Promise<Task> {
    return this.tasksService.deleteComment(tenant, user, id, commentId);
  }

  @Post(':id/comments/:commentId/reply')
  @RequirePermissions(PERMISSIONS.TASKS_VIEW)
  @ApiOperation({ summary: 'Add a threaded reply to a comment' })
  async addReply(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() dto: CreateReplyDto,
  ): Promise<Task> {
    return this.tasksService.addReply(tenant, user, id, commentId, dto);
  }

  @Delete(':id/comments/:commentId/reply/:replyId')
  @RequirePermissions(PERMISSIONS.TASKS_VIEW)
  @ApiOperation({ summary: 'Delete a threaded reply' })
  async deleteReply(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Param('replyId') replyId: string,
  ): Promise<Task> {
    return this.tasksService.deleteReply(tenant, user, id, commentId, replyId);
  }

  @Post(':id/comments/:commentId/react')
  @RequirePermissions(PERMISSIONS.TASKS_VIEW)
  @ApiOperation({ summary: 'Toggle an emoji reaction on a comment' })
  async toggleCommentReaction(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() dto: ToggleReactionDto,
  ): Promise<Task> {
    return this.tasksService.toggleReaction(tenant, user, id, commentId, dto.emoji);
  }

  @Post(':id/comments/:commentId/reply/:replyId/react')
  @RequirePermissions(PERMISSIONS.TASKS_VIEW)
  @ApiOperation({ summary: 'Toggle an emoji reaction on a reply' })
  async toggleReplyReaction(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Param('replyId') replyId: string,
    @Body() dto: ToggleReactionDto,
  ): Promise<Task> {
    return this.tasksService.toggleReaction(tenant, user, id, commentId, dto.emoji, replyId);
  }

  @Post(':id/start-timer')
  @RequirePermissions(PERMISSIONS.TASKS_UPDATE)
  @ApiOperation({ summary: 'Start live time tracker on task' })
  async startTimer(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<Task> {
    return this.tasksService.startTimer(tenant, user, id);
  }

  @Post(':id/stop-timer')
  @RequirePermissions(PERMISSIONS.TASKS_UPDATE)
  @ApiOperation({ summary: 'Stop live time tracker and log duration' })
  async stopTimer(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<Task> {
    return this.tasksService.stopTimer(tenant, user, id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.TASKS_DELETE)
  @ApiOperation({ summary: 'Delete a task' })
  async delete(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.tasksService.delete(tenant, id);
  }
}
