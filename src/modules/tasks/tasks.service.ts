import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import {
  Task,
  TaskSchema,
  TaskStatus,
  TaskPriority,
  TaskSubtask,
  TaskComment,
  CommentReaction,
  CommentReply,
} from './schemas/task.schema';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema';
import {
  CreateTaskDto,
  UpdateTaskDto,
  LogTaskTimeDto,
  CreateSubtaskDto,
  UpdateSubtaskDto,
  CreateCommentDto,
  CreateReplyDto,
  ToggleReactionDto,
} from './dto/task.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly regionalDbManager: RegionalDatabaseManager,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(
    tenant: TenantContext,
    user: JwtPayload,
    filters?: { status?: TaskStatus; assigneeId?: string },
  ): Promise<Task[]> {
    const model = await this.regionalDbManager.getModel<Task>(
      tenant.region,
      Task.name,
      TaskSchema,
    );

    const query: Record<string, unknown> = { companyId: tenant.companyId };
    if (filters?.status) query['status'] = filters.status;

    // Strict Personal Scoping: If user is standard employee without elevated permissions,
    // they can only see tasks assigned to them or created by them
    const isElevated =
      user.isOwner ||
      user.role === 'OWNER' ||
      user.role === 'ADMIN' ||
      (user.permissions &&
        (user.permissions.includes('tasks.delete') ||
          user.permissions.includes('tasks.manage') ||
          user.permissions.includes('reports.view')));

    if (!isElevated) {
      query['$or'] = [
        { assigneeId: user.userId },
        { 'assignees.userId': user.userId },
        { createdBy: user.userId },
      ];
    } else if (filters?.assigneeId) {
      query['$or'] = [
        { assigneeId: filters.assigneeId },
        { 'assignees.userId': filters.assigneeId },
      ];
    }

    return model.find(query).sort({ createdAt: -1 }).lean();
  }

  async findOne(tenant: TenantContext, taskId: string): Promise<Task> {
    const model = await this.regionalDbManager.getModel<Task>(
      tenant.region,
      Task.name,
      TaskSchema,
    );
    const task = await model.findOne({ companyId: tenant.companyId, taskId }).lean();
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async create(
    tenant: TenantContext,
    user: JwtPayload,
    dto: CreateTaskDto,
  ): Promise<Task> {
    const model = await this.regionalDbManager.getModel<Task>(
      tenant.region,
      Task.name,
      TaskSchema,
    );

    const employeeModel = await this.regionalDbManager.getModel<Employee>(
      tenant.region,
      Employee.name,
      EmployeeSchema,
    );

    // Collect all assignee IDs
    const allAssigneeIds = new Set<string>();
    if (dto.assigneeId) allAssigneeIds.add(dto.assigneeId);
    if (dto.assigneeIds && dto.assigneeIds.length > 0) {
      dto.assigneeIds.forEach((id) => allAssigneeIds.add(id));
    }

    const assignees: Array<{ userId: string; name: string; avatarUrl?: string }> = [];
    let primaryAssigneeName: string | undefined;

    if (dto.assignees && Array.isArray(dto.assignees)) {
      for (const a of dto.assignees) {
        if (a && a.userId) {
          assignees.push({
            userId: a.userId,
            name: a.name || 'Team Member',
            avatarUrl: a.avatarUrl,
          });
        }
      }
    }

    if (allAssigneeIds.size > 0) {
      const emps = await employeeModel
        .find({
          companyId: tenant.companyId,
          $or: [
            { employeeId: { $in: Array.from(allAssigneeIds) } },
            { userId: { $in: Array.from(allAssigneeIds) } },
          ],
        })
        .lean();

      for (const emp of emps) {
        const name = `${emp.firstName} ${emp.lastName}`;
        const uId = emp.userId || emp.employeeId;
        if (!assignees.some((a) => a.userId === uId)) {
          assignees.push({
            userId: uId,
            name,
            avatarUrl: emp.avatarUrl,
          });
        }
        if (emp.employeeId === dto.assigneeId || emp.userId === dto.assigneeId) {
          primaryAssigneeName = name;
        }
      }
    }

    if (!primaryAssigneeName && assignees.length > 0) {
      primaryAssigneeName = assignees[0].name;
    }

    const taskId = `task_${randomUUID()}`;

    return model.create({
      taskId,
      companyId: tenant.companyId,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      status: dto.status || TaskStatus.TODO,
      priority: dto.priority || TaskPriority.MEDIUM,
      assigneeId: dto.assigneeId || (assignees.length > 0 ? assignees[0].userId : undefined),
      assigneeName: primaryAssigneeName,
      assignees,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      createdBy: user.userId,
      timeLogs: [],
      totalSpentMinutes: 0,
      isTimerRunning: false,
    });
  }

  async update(
    tenant: TenantContext,
    taskId: string,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    const model = await this.regionalDbManager.getModel<Task>(
      tenant.region,
      Task.name,
      TaskSchema,
    );

    const payload: Record<string, unknown> = {};
    if (dto.title !== undefined) payload['title'] = dto.title.trim();
    if (dto.description !== undefined) payload['description'] = dto.description?.trim();
    if (dto.status !== undefined) payload['status'] = dto.status;
    if (dto.priority !== undefined) payload['priority'] = dto.priority;
    if (dto.dueDate !== undefined) {
      payload['dueDate'] = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    if (dto.assigneeId !== undefined || dto.assigneeIds !== undefined) {
      const employeeModel = await this.regionalDbManager.getModel<Employee>(
        tenant.region,
        Employee.name,
        EmployeeSchema,
      );

      const allAssigneeIds = new Set<string>();
      if (dto.assigneeId) allAssigneeIds.add(dto.assigneeId);
      if (dto.assigneeIds) dto.assigneeIds.forEach((id) => allAssigneeIds.add(id));

      const assignees: Array<{ userId: string; name: string; avatarUrl?: string }> = [];
      let primaryAssigneeName: string | undefined;

      if (allAssigneeIds.size > 0) {
        const emps = await employeeModel
          .find({
            companyId: tenant.companyId,
            $or: [
              { employeeId: { $in: Array.from(allAssigneeIds) } },
              { userId: { $in: Array.from(allAssigneeIds) } },
            ],
          })
          .lean();

        for (const emp of emps) {
          const name = `${emp.firstName} ${emp.lastName}`;
          assignees.push({
            userId: emp.userId || emp.employeeId,
            name,
            avatarUrl: emp.avatarUrl,
          });
          if (emp.employeeId === dto.assigneeId || emp.userId === dto.assigneeId) {
            primaryAssigneeName = name;
          }
        }
        if (!primaryAssigneeName && assignees.length > 0) {
          primaryAssigneeName = assignees[0].name;
        }
      }

      payload['assignees'] = assignees;
      payload['assigneeId'] = dto.assigneeId || (assignees[0]?.userId);
      payload['assigneeName'] = primaryAssigneeName;
    }

    const updated = await model
      .findOneAndUpdate(
        { companyId: tenant.companyId, taskId },
        { $set: payload },
        { new: true },
      )
      .lean();

    if (!updated) {
      throw new NotFoundException('Task not found');
    }

    return updated;
  }

  async startTimer(tenant: TenantContext, user: JwtPayload, taskId: string): Promise<Task> {
    const model = await this.regionalDbManager.getModel<Task>(
      tenant.region,
      Task.name,
      TaskSchema,
    );

    const task = await model.findOne({ companyId: tenant.companyId, taskId });
    if (!task) throw new NotFoundException('Task not found');

    task.isTimerRunning = true;
    task.activeTimerUserId = user.userId;
    task.activeTimerStartTime = new Date();
    if (task.status === TaskStatus.TODO) {
      task.status = TaskStatus.IN_PROGRESS;
    }

    await task.save();
    return task.toObject();
  }

  async stopTimer(tenant: TenantContext, user: JwtPayload, taskId: string): Promise<Task> {
    const model = await this.regionalDbManager.getModel<Task>(
      tenant.region,
      Task.name,
      TaskSchema,
    );

    const task = await model.findOne({ companyId: tenant.companyId, taskId });
    if (!task) throw new NotFoundException('Task not found');

    if (task.isTimerRunning && task.activeTimerStartTime) {
      const now = new Date();
      const durationMinutes = Math.max(
        1,
        Math.round((now.getTime() - new Date(task.activeTimerStartTime).getTime()) / 60000),
      );

      task.timeLogs.push({
        logId: `log_${randomUUID()}`,
        userId: user.userId,
        userName: user.email,
        startTime: task.activeTimerStartTime,
        endTime: now,
        durationMinutes,
      });

      task.totalSpentMinutes = (task.totalSpentMinutes || 0) + durationMinutes;
      task.isTimerRunning = false;
      task.activeTimerUserId = undefined;
      task.activeTimerStartTime = undefined;

      await task.save();
    }

    return task.toObject();
  }

  async delete(
    tenant: TenantContext,
    taskId: string,
  ): Promise<{ success: boolean }> {
    const model = await this.regionalDbManager.getModel<Task>(
      tenant.region,
      Task.name,
      TaskSchema,
    );

    const result = await model.deleteOne({
      companyId: tenant.companyId,
      taskId,
    });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Task not found');
    }

    return { success: true };
  }

  async addSubtask(
    tenant: TenantContext,
    taskId: string,
    dto: CreateSubtaskDto,
  ): Promise<Task> {
    const model = await this.regionalDbManager.getModel<Task>(
      tenant.region,
      Task.name,
      TaskSchema,
    );
    const task = await model.findOne({ companyId: tenant.companyId, taskId });
    if (!task) throw new NotFoundException('Task not found');

    const subtask: TaskSubtask = {
      subtaskId: `sub_${randomUUID()}`,
      title: dto.title.trim(),
      isCompleted: false,
      createdAt: new Date(),
    };

    if (!task.subtasks) task.subtasks = [];
    task.subtasks.push(subtask);
    task.markModified('subtasks');
    await task.save();
    return task.toObject();
  }

  async updateSubtask(
    tenant: TenantContext,
    taskId: string,
    subtaskId: string,
    dto: UpdateSubtaskDto,
  ): Promise<Task> {
    const model = await this.regionalDbManager.getModel<Task>(
      tenant.region,
      Task.name,
      TaskSchema,
    );
    const task = await model.findOne({ companyId: tenant.companyId, taskId });
    if (!task) throw new NotFoundException('Task not found');

    const subtask = (task.subtasks || []).find((s) => s.subtaskId === subtaskId);
    if (!subtask) throw new NotFoundException('Subtask not found');

    if (dto.title !== undefined) subtask.title = dto.title.trim();
    if (dto.isCompleted !== undefined) subtask.isCompleted = dto.isCompleted;

    task.markModified('subtasks');
    await task.save();
    return task.toObject();
  }

  async deleteSubtask(
    tenant: TenantContext,
    taskId: string,
    subtaskId: string,
  ): Promise<Task> {
    const model = await this.regionalDbManager.getModel<Task>(
      tenant.region,
      Task.name,
      TaskSchema,
    );
    const task = await model.findOne({ companyId: tenant.companyId, taskId });
    if (!task) throw new NotFoundException('Task not found');

    task.subtasks = (task.subtasks || []).filter((s) => s.subtaskId !== subtaskId);
    task.markModified('subtasks');
    await task.save();
    return task.toObject();
  }

  private async getUserProfile(
    tenant: TenantContext,
    userId: string,
    fallbackName?: string,
  ): Promise<{ name: string; avatarUrl?: string }> {
    try {
      const employeeModel = await this.regionalDbManager.getModel<Employee>(
        tenant.region,
        Employee.name,
        EmployeeSchema,
      );
      const emp = await employeeModel
        .findOne({
          companyId: tenant.companyId,
          $or: [{ userId }, { employeeId: userId }],
        })
        .lean();

      if (emp) {
        const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
        return {
          name: fullName || fallbackName || 'Team Member',
          avatarUrl: emp.avatarUrl,
        };
      }
    } catch {}

    return { name: fallbackName || 'Team Member' };
  }

  // Notifies all assigned teammates and task creator of comment activities
  private async notifyTaskMembers(
    tenant: TenantContext,
    task: Task,
    actorUserId: string,
    title: string,
    message: string,
    data: Record<string, any> = {},
  ): Promise<void> {
    const recipients = new Set<string>();

    if (task.assigneeId && task.assigneeId !== actorUserId) {
      recipients.add(task.assigneeId);
    }
    if (task.createdBy && task.createdBy !== actorUserId) {
      recipients.add(task.createdBy);
    }
    if (task.assignees && Array.isArray(task.assignees)) {
      for (const a of task.assignees) {
        if (a.userId && a.userId !== actorUserId) {
          recipients.add(a.userId);
        }
      }
    }

    for (const recipientId of recipients) {
      this.notificationsService
        .createAndPush({
          region: tenant.region,
          companyId: tenant.companyId,
          userId: recipientId,
          title,
          message,
          type: NotificationType.TASK,
          data: { taskId: task.taskId, ...data },
        })
        .catch((err) => this.logger.warn(`Failed to push task notification: ${err.message}`));
    }
  }

  async addComment(
    tenant: TenantContext,
    user: JwtPayload,
    taskId: string,
    dto: CreateCommentDto,
  ): Promise<Task> {
    const model = await this.regionalDbManager.getModel<Task>(
      tenant.region,
      Task.name,
      TaskSchema,
    );
    const task = await model.findOne({ companyId: tenant.companyId, taskId });
    if (!task) throw new NotFoundException('Task not found');

    const profile = await this.getUserProfile(
      tenant,
      user.userId,
      (user as any).displayName || user.email,
    );

    const comment: TaskComment = {
      commentId: `cmt_${randomUUID()}`,
      userId: user.userId,
      userName: profile.name,
      userAvatar: profile.avatarUrl,
      content: dto.content.trim(),
      reactions: [],
      replies: [],
      createdAt: new Date(),
    };

    if (!task.comments) task.comments = [];
    task.comments.push(comment);
    task.markModified('comments');
    await task.save();

    // Notify all task assignees and project members
    const snippet = dto.content.length > 60 ? `${dto.content.slice(0, 60)}...` : dto.content;
    await this.notifyTaskMembers(
      tenant,
      task,
      user.userId,
      `💬 New comment on "${task.title}"`,
      `${profile.name}: "${snippet}"`,
      { commentId: comment.commentId },
    );

    return task.toObject();
  }

  async addReply(
    tenant: TenantContext,
    user: JwtPayload,
    taskId: string,
    commentId: string,
    dto: CreateReplyDto,
  ): Promise<Task> {
    const model = await this.regionalDbManager.getModel<Task>(
      tenant.region,
      Task.name,
      TaskSchema,
    );
    const task = await model.findOne({ companyId: tenant.companyId, taskId });
    if (!task) throw new NotFoundException('Task not found');

    const comment = (task.comments || []).find((c) => c.commentId === commentId);
    if (!comment) throw new NotFoundException('Parent comment not found');

    const profile = await this.getUserProfile(
      tenant,
      user.userId,
      (user as any).displayName || user.email,
    );

    const reply: CommentReply = {
      replyId: `rpl_${randomUUID()}`,
      userId: user.userId,
      userName: profile.name,
      userAvatar: profile.avatarUrl,
      content: dto.content.trim(),
      reactions: [],
      createdAt: new Date(),
    };

    if (!comment.replies) comment.replies = [];
    comment.replies.push(reply);
    task.markModified('comments');
    await task.save();

    const snippet = dto.content.length > 60 ? `${dto.content.slice(0, 60)}...` : dto.content;

    // Notify parent comment author if not self
    if (comment.userId && comment.userId !== user.userId) {
      this.notificationsService
        .createAndPush({
          region: tenant.region,
          companyId: tenant.companyId,
          userId: comment.userId,
          title: `💬 Reply to your comment`,
          message: `${profile.name} replied on "${task.title}": "${snippet}"`,
          type: NotificationType.TASK,
          data: { taskId: task.taskId, commentId, replyId: reply.replyId },
        })
        .catch((err) => this.logger.warn(`Failed to push reply notification: ${err.message}`));
    }

    // Also notify other task members
    await this.notifyTaskMembers(
      tenant,
      task,
      user.userId,
      `💬 New reply on "${task.title}"`,
      `${profile.name}: "${snippet}"`,
      { commentId, replyId: reply.replyId },
    );

    return task.toObject();
  }

  async deleteComment(
    tenant: TenantContext,
    user: JwtPayload,
    taskId: string,
    commentId: string,
  ): Promise<Task> {
    const model = await this.regionalDbManager.getModel<Task>(
      tenant.region,
      Task.name,
      TaskSchema,
    );
    const task = await model.findOne({ companyId: tenant.companyId, taskId });
    if (!task) throw new NotFoundException('Task not found');

    const comment = (task.comments || []).find((c) => c.commentId === commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    if (
      comment.userId !== user.userId &&
      !user.isOwner &&
      user.role !== 'OWNER' &&
      user.role !== 'ADMIN'
    ) {
      throw new BadRequestException('Not authorized to delete this comment');
    }

    task.comments = task.comments.filter((c) => c.commentId !== commentId);
    task.markModified('comments');
    await task.save();
    return task.toObject();
  }

  async deleteReply(
    tenant: TenantContext,
    user: JwtPayload,
    taskId: string,
    commentId: string,
    replyId: string,
  ): Promise<Task> {
    const model = await this.regionalDbManager.getModel<Task>(
      tenant.region,
      Task.name,
      TaskSchema,
    );
    const task = await model.findOne({ companyId: tenant.companyId, taskId });
    if (!task) throw new NotFoundException('Task not found');

    const comment = (task.comments || []).find((c) => c.commentId === commentId);
    if (!comment) throw new NotFoundException('Parent comment not found');

    const reply = (comment.replies || []).find((r) => r.replyId === replyId);
    if (!reply) throw new NotFoundException('Reply not found');

    if (
      reply.userId !== user.userId &&
      !user.isOwner &&
      user.role !== 'OWNER' &&
      user.role !== 'ADMIN'
    ) {
      throw new BadRequestException('Not authorized to delete this reply');
    }

    comment.replies = (comment.replies || []).filter((r) => r.replyId !== replyId);
    task.markModified('comments');
    await task.save();
    return task.toObject();
  }

  async toggleReaction(
    tenant: TenantContext,
    user: JwtPayload,
    taskId: string,
    commentId: string,
    emoji: string,
    replyId?: string,
  ): Promise<Task> {
    const model = await this.regionalDbManager.getModel<Task>(
      tenant.region,
      Task.name,
      TaskSchema,
    );
    const task = await model.findOne({ companyId: tenant.companyId, taskId });
    if (!task) throw new NotFoundException('Task not found');

    const comment = (task.comments || []).find((c) => c.commentId === commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    const profile = await this.getUserProfile(
      tenant,
      user.userId,
      (user as any).displayName || user.email,
    );

    let targetItem: { reactions?: CommentReaction[]; userId: string };
    let isReply = false;

    if (replyId) {
      const reply = (comment.replies || []).find((r) => r.replyId === replyId);
      if (!reply) throw new NotFoundException('Reply not found');
      targetItem = reply;
      isReply = true;
    } else {
      targetItem = comment;
    }

    if (!targetItem.reactions) targetItem.reactions = [];

    const existingIndex = targetItem.reactions.findIndex((r) => r.userId === user.userId);
    let addedReaction = false;

    if (existingIndex >= 0) {
      if (targetItem.reactions[existingIndex].emoji === emoji) {
        // Toggle off
        targetItem.reactions.splice(existingIndex, 1);
      } else {
        // Switch emoji
        targetItem.reactions[existingIndex].emoji = emoji;
        targetItem.reactions[existingIndex].userName = profile.name;
        targetItem.reactions[existingIndex].createdAt = new Date();
        addedReaction = true;
      }
    } else {
      targetItem.reactions.push({
        userId: user.userId,
        userName: profile.name,
        emoji,
        createdAt: new Date(),
      });
      addedReaction = true;
    }

    task.markModified('comments');
    await task.save();

    // If reaction added on someone else's item, notify them
    if (addedReaction && targetItem.userId && targetItem.userId !== user.userId) {
      this.notificationsService
        .createAndPush({
          region: tenant.region,
          companyId: tenant.companyId,
          userId: targetItem.userId,
          title: `${emoji} Reaction on your ${isReply ? 'reply' : 'comment'}`,
          message: `${profile.name} reacted ${emoji} on "${task.title}"`,
          type: NotificationType.TASK,
          data: { taskId: task.taskId, commentId, replyId },
        })
        .catch((err) => this.logger.warn(`Failed to push reaction notification: ${err.message}`));
    }

    return task.toObject();
  }
}
