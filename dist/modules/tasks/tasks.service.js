"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TasksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const task_schema_1 = require("./schemas/task.schema");
const employee_schema_1 = require("../employees/schemas/employee.schema");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_schema_1 = require("../notifications/schemas/notification.schema");
let TasksService = TasksService_1 = class TasksService {
    constructor(regionalDbManager, notificationsService) {
        this.regionalDbManager = regionalDbManager;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(TasksService_1.name);
    }
    async findAll(tenant, user, filters) {
        const model = await this.regionalDbManager.getModel(tenant.region, task_schema_1.Task.name, task_schema_1.TaskSchema);
        const query = { companyId: tenant.companyId };
        if (filters?.status)
            query['status'] = filters.status;
        const isElevated = user.isOwner ||
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
        }
        else if (filters?.assigneeId) {
            query['$or'] = [
                { assigneeId: filters.assigneeId },
                { 'assignees.userId': filters.assigneeId },
            ];
        }
        return model.find(query).sort({ createdAt: -1 }).lean();
    }
    async findOne(tenant, taskId) {
        const model = await this.regionalDbManager.getModel(tenant.region, task_schema_1.Task.name, task_schema_1.TaskSchema);
        const task = await model.findOne({ companyId: tenant.companyId, taskId }).lean();
        if (!task) {
            throw new common_1.NotFoundException('Task not found');
        }
        return task;
    }
    async create(tenant, user, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, task_schema_1.Task.name, task_schema_1.TaskSchema);
        const employeeModel = await this.regionalDbManager.getModel(tenant.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
        const allAssigneeIds = new Set();
        if (dto.assigneeId)
            allAssigneeIds.add(dto.assigneeId);
        if (dto.assigneeIds && dto.assigneeIds.length > 0) {
            dto.assigneeIds.forEach((id) => allAssigneeIds.add(id));
        }
        const assignees = [];
        let primaryAssigneeName;
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
        const taskId = `task_${(0, crypto_1.randomUUID)()}`;
        return model.create({
            taskId,
            companyId: tenant.companyId,
            title: dto.title.trim(),
            description: dto.description?.trim(),
            status: dto.status || task_schema_1.TaskStatus.TODO,
            priority: dto.priority || task_schema_1.TaskPriority.MEDIUM,
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
    async update(tenant, taskId, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, task_schema_1.Task.name, task_schema_1.TaskSchema);
        const payload = {};
        if (dto.title !== undefined)
            payload['title'] = dto.title.trim();
        if (dto.description !== undefined)
            payload['description'] = dto.description?.trim();
        if (dto.status !== undefined)
            payload['status'] = dto.status;
        if (dto.priority !== undefined)
            payload['priority'] = dto.priority;
        if (dto.dueDate !== undefined) {
            payload['dueDate'] = dto.dueDate ? new Date(dto.dueDate) : null;
        }
        if (dto.assigneeId !== undefined || dto.assigneeIds !== undefined) {
            const employeeModel = await this.regionalDbManager.getModel(tenant.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
            const allAssigneeIds = new Set();
            if (dto.assigneeId)
                allAssigneeIds.add(dto.assigneeId);
            if (dto.assigneeIds)
                dto.assigneeIds.forEach((id) => allAssigneeIds.add(id));
            const assignees = [];
            let primaryAssigneeName;
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
            .findOneAndUpdate({ companyId: tenant.companyId, taskId }, { $set: payload }, { new: true })
            .lean();
        if (!updated) {
            throw new common_1.NotFoundException('Task not found');
        }
        return updated;
    }
    async startTimer(tenant, user, taskId) {
        const model = await this.regionalDbManager.getModel(tenant.region, task_schema_1.Task.name, task_schema_1.TaskSchema);
        const task = await model.findOne({ companyId: tenant.companyId, taskId });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        task.isTimerRunning = true;
        task.activeTimerUserId = user.userId;
        task.activeTimerStartTime = new Date();
        if (task.status === task_schema_1.TaskStatus.TODO) {
            task.status = task_schema_1.TaskStatus.IN_PROGRESS;
        }
        await task.save();
        return task.toObject();
    }
    async stopTimer(tenant, user, taskId) {
        const model = await this.regionalDbManager.getModel(tenant.region, task_schema_1.Task.name, task_schema_1.TaskSchema);
        const task = await model.findOne({ companyId: tenant.companyId, taskId });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        if (task.isTimerRunning && task.activeTimerStartTime) {
            const now = new Date();
            const durationMinutes = Math.max(1, Math.round((now.getTime() - new Date(task.activeTimerStartTime).getTime()) / 60000));
            task.timeLogs.push({
                logId: `log_${(0, crypto_1.randomUUID)()}`,
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
    async delete(tenant, taskId) {
        const model = await this.regionalDbManager.getModel(tenant.region, task_schema_1.Task.name, task_schema_1.TaskSchema);
        const result = await model.deleteOne({
            companyId: tenant.companyId,
            taskId,
        });
        if (result.deletedCount === 0) {
            throw new common_1.NotFoundException('Task not found');
        }
        return { success: true };
    }
    async addSubtask(tenant, taskId, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, task_schema_1.Task.name, task_schema_1.TaskSchema);
        const task = await model.findOne({ companyId: tenant.companyId, taskId });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        const subtask = {
            subtaskId: `sub_${(0, crypto_1.randomUUID)()}`,
            title: dto.title.trim(),
            isCompleted: false,
            createdAt: new Date(),
        };
        if (!task.subtasks)
            task.subtasks = [];
        task.subtasks.push(subtask);
        task.markModified('subtasks');
        await task.save();
        return task.toObject();
    }
    async updateSubtask(tenant, taskId, subtaskId, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, task_schema_1.Task.name, task_schema_1.TaskSchema);
        const task = await model.findOne({ companyId: tenant.companyId, taskId });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        const subtask = (task.subtasks || []).find((s) => s.subtaskId === subtaskId);
        if (!subtask)
            throw new common_1.NotFoundException('Subtask not found');
        if (dto.title !== undefined)
            subtask.title = dto.title.trim();
        if (dto.isCompleted !== undefined)
            subtask.isCompleted = dto.isCompleted;
        task.markModified('subtasks');
        await task.save();
        return task.toObject();
    }
    async deleteSubtask(tenant, taskId, subtaskId) {
        const model = await this.regionalDbManager.getModel(tenant.region, task_schema_1.Task.name, task_schema_1.TaskSchema);
        const task = await model.findOne({ companyId: tenant.companyId, taskId });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        task.subtasks = (task.subtasks || []).filter((s) => s.subtaskId !== subtaskId);
        task.markModified('subtasks');
        await task.save();
        return task.toObject();
    }
    async getUserProfile(tenant, userId, fallbackName) {
        try {
            const employeeModel = await this.regionalDbManager.getModel(tenant.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
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
        }
        catch { }
        return { name: fallbackName || 'Team Member' };
    }
    async notifyTaskMembers(tenant, task, actorUserId, title, message, data = {}) {
        const recipients = new Set();
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
                type: notification_schema_1.NotificationType.TASK,
                data: { taskId: task.taskId, ...data },
            })
                .catch((err) => this.logger.warn(`Failed to push task notification: ${err.message}`));
        }
    }
    async addComment(tenant, user, taskId, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, task_schema_1.Task.name, task_schema_1.TaskSchema);
        const task = await model.findOne({ companyId: tenant.companyId, taskId });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        const profile = await this.getUserProfile(tenant, user.userId, user.displayName || user.email);
        const comment = {
            commentId: `cmt_${(0, crypto_1.randomUUID)()}`,
            userId: user.userId,
            userName: profile.name,
            userAvatar: profile.avatarUrl,
            content: dto.content.trim(),
            reactions: [],
            replies: [],
            createdAt: new Date(),
        };
        if (!task.comments)
            task.comments = [];
        task.comments.push(comment);
        task.markModified('comments');
        await task.save();
        const snippet = dto.content.length > 60 ? `${dto.content.slice(0, 60)}...` : dto.content;
        await this.notifyTaskMembers(tenant, task, user.userId, `💬 New comment on "${task.title}"`, `${profile.name}: "${snippet}"`, { commentId: comment.commentId });
        return task.toObject();
    }
    async addReply(tenant, user, taskId, commentId, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, task_schema_1.Task.name, task_schema_1.TaskSchema);
        const task = await model.findOne({ companyId: tenant.companyId, taskId });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        const comment = (task.comments || []).find((c) => c.commentId === commentId);
        if (!comment)
            throw new common_1.NotFoundException('Parent comment not found');
        const profile = await this.getUserProfile(tenant, user.userId, user.displayName || user.email);
        const reply = {
            replyId: `rpl_${(0, crypto_1.randomUUID)()}`,
            userId: user.userId,
            userName: profile.name,
            userAvatar: profile.avatarUrl,
            content: dto.content.trim(),
            reactions: [],
            createdAt: new Date(),
        };
        if (!comment.replies)
            comment.replies = [];
        comment.replies.push(reply);
        task.markModified('comments');
        await task.save();
        const snippet = dto.content.length > 60 ? `${dto.content.slice(0, 60)}...` : dto.content;
        if (comment.userId && comment.userId !== user.userId) {
            this.notificationsService
                .createAndPush({
                region: tenant.region,
                companyId: tenant.companyId,
                userId: comment.userId,
                title: `💬 Reply to your comment`,
                message: `${profile.name} replied on "${task.title}": "${snippet}"`,
                type: notification_schema_1.NotificationType.TASK,
                data: { taskId: task.taskId, commentId, replyId: reply.replyId },
            })
                .catch((err) => this.logger.warn(`Failed to push reply notification: ${err.message}`));
        }
        await this.notifyTaskMembers(tenant, task, user.userId, `💬 New reply on "${task.title}"`, `${profile.name}: "${snippet}"`, { commentId, replyId: reply.replyId });
        return task.toObject();
    }
    async deleteComment(tenant, user, taskId, commentId) {
        const model = await this.regionalDbManager.getModel(tenant.region, task_schema_1.Task.name, task_schema_1.TaskSchema);
        const task = await model.findOne({ companyId: tenant.companyId, taskId });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        const comment = (task.comments || []).find((c) => c.commentId === commentId);
        if (!comment)
            throw new common_1.NotFoundException('Comment not found');
        if (comment.userId !== user.userId &&
            !user.isOwner &&
            user.role !== 'OWNER' &&
            user.role !== 'ADMIN') {
            throw new common_1.BadRequestException('Not authorized to delete this comment');
        }
        task.comments = task.comments.filter((c) => c.commentId !== commentId);
        task.markModified('comments');
        await task.save();
        return task.toObject();
    }
    async deleteReply(tenant, user, taskId, commentId, replyId) {
        const model = await this.regionalDbManager.getModel(tenant.region, task_schema_1.Task.name, task_schema_1.TaskSchema);
        const task = await model.findOne({ companyId: tenant.companyId, taskId });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        const comment = (task.comments || []).find((c) => c.commentId === commentId);
        if (!comment)
            throw new common_1.NotFoundException('Parent comment not found');
        const reply = (comment.replies || []).find((r) => r.replyId === replyId);
        if (!reply)
            throw new common_1.NotFoundException('Reply not found');
        if (reply.userId !== user.userId &&
            !user.isOwner &&
            user.role !== 'OWNER' &&
            user.role !== 'ADMIN') {
            throw new common_1.BadRequestException('Not authorized to delete this reply');
        }
        comment.replies = (comment.replies || []).filter((r) => r.replyId !== replyId);
        task.markModified('comments');
        await task.save();
        return task.toObject();
    }
    async toggleReaction(tenant, user, taskId, commentId, emoji, replyId) {
        const model = await this.regionalDbManager.getModel(tenant.region, task_schema_1.Task.name, task_schema_1.TaskSchema);
        const task = await model.findOne({ companyId: tenant.companyId, taskId });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        const comment = (task.comments || []).find((c) => c.commentId === commentId);
        if (!comment)
            throw new common_1.NotFoundException('Comment not found');
        const profile = await this.getUserProfile(tenant, user.userId, user.displayName || user.email);
        let targetItem;
        let isReply = false;
        if (replyId) {
            const reply = (comment.replies || []).find((r) => r.replyId === replyId);
            if (!reply)
                throw new common_1.NotFoundException('Reply not found');
            targetItem = reply;
            isReply = true;
        }
        else {
            targetItem = comment;
        }
        if (!targetItem.reactions)
            targetItem.reactions = [];
        const existingIndex = targetItem.reactions.findIndex((r) => r.userId === user.userId);
        let addedReaction = false;
        if (existingIndex >= 0) {
            if (targetItem.reactions[existingIndex].emoji === emoji) {
                targetItem.reactions.splice(existingIndex, 1);
            }
            else {
                targetItem.reactions[existingIndex].emoji = emoji;
                targetItem.reactions[existingIndex].userName = profile.name;
                targetItem.reactions[existingIndex].createdAt = new Date();
                addedReaction = true;
            }
        }
        else {
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
        if (addedReaction && targetItem.userId && targetItem.userId !== user.userId) {
            this.notificationsService
                .createAndPush({
                region: tenant.region,
                companyId: tenant.companyId,
                userId: targetItem.userId,
                title: `${emoji} Reaction on your ${isReply ? 'reply' : 'comment'}`,
                message: `${profile.name} reacted ${emoji} on "${task.title}"`,
                type: notification_schema_1.NotificationType.TASK,
                data: { taskId: task.taskId, commentId, replyId },
            })
                .catch((err) => this.logger.warn(`Failed to push reaction notification: ${err.message}`));
        }
        return task.toObject();
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = TasksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [regional_database_manager_1.RegionalDatabaseManager,
        notifications_service_1.NotificationsService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map