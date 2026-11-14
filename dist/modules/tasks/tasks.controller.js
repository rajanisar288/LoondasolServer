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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tasks_service_1 = require("./tasks.service");
const task_dto_1 = require("./dto/task.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../common/guards/tenant.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const require_permissions_decorator_1 = require("../../common/decorators/require-permissions.decorator");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
const task_schema_1 = require("./schemas/task.schema");
let TasksController = class TasksController {
    constructor(tasksService) {
        this.tasksService = tasksService;
    }
    async findAll(tenant, user, status, assigneeId) {
        return this.tasksService.findAll(tenant, user, { status, assigneeId });
    }
    async findOne(tenant, id) {
        return this.tasksService.findOne(tenant, id);
    }
    async create(tenant, user, dto) {
        return this.tasksService.create(tenant, user, dto);
    }
    async update(tenant, user, id, dto) {
        return this.tasksService.update(tenant, id, dto, user);
    }
    async addSubtask(tenant, id, dto) {
        return this.tasksService.addSubtask(tenant, id, dto);
    }
    async updateSubtask(tenant, id, subtaskId, dto) {
        return this.tasksService.updateSubtask(tenant, id, subtaskId, dto);
    }
    async deleteSubtask(tenant, id, subtaskId) {
        return this.tasksService.deleteSubtask(tenant, id, subtaskId);
    }
    async addComment(tenant, user, id, dto) {
        return this.tasksService.addComment(tenant, user, id, dto);
    }
    async deleteComment(tenant, user, id, commentId) {
        return this.tasksService.deleteComment(tenant, user, id, commentId);
    }
    async addReply(tenant, user, id, commentId, dto) {
        return this.tasksService.addReply(tenant, user, id, commentId, dto);
    }
    async deleteReply(tenant, user, id, commentId, replyId) {
        return this.tasksService.deleteReply(tenant, user, id, commentId, replyId);
    }
    async toggleCommentReaction(tenant, user, id, commentId, dto) {
        return this.tasksService.toggleReaction(tenant, user, id, commentId, dto.emoji);
    }
    async toggleReplyReaction(tenant, user, id, commentId, replyId, dto) {
        return this.tasksService.toggleReaction(tenant, user, id, commentId, dto.emoji, replyId);
    }
    async startTimer(tenant, user, id) {
        return this.tasksService.startTimer(tenant, user, id);
    }
    async stopTimer(tenant, user, id) {
        return this.tasksService.stopTimer(tenant, user, id);
    }
    async delete(tenant, id) {
        return this.tasksService.delete(tenant, id);
    }
};
exports.TasksController = TasksController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.TASKS_VIEW),
    (0, swagger_1.ApiOperation)({
        summary: 'List company tasks with optional status and assignee filter',
    }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('assigneeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.TASKS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get single task by ID' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.TASKS_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new task' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, task_dto_1.CreateTaskDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.TASKS_UPDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Update a task' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, task_dto_1.UpdateTaskDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/subtasks'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.TASKS_UPDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Add a subtask to task' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, task_dto_1.CreateSubtaskDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "addSubtask", null);
__decorate([
    (0, common_1.Patch)(':id/subtasks/:subtaskId'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.TASKS_UPDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Update or toggle subtask' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('subtaskId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, task_dto_1.UpdateSubtaskDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "updateSubtask", null);
__decorate([
    (0, common_1.Delete)(':id/subtasks/:subtaskId'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.TASKS_UPDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a subtask' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('subtaskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "deleteSubtask", null);
__decorate([
    (0, common_1.Post)(':id/comments'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.TASKS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Add a comment to task discussion' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, task_dto_1.CreateCommentDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "addComment", null);
__decorate([
    (0, common_1.Delete)(':id/comments/:commentId'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.TASKS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a comment from task' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Param)('commentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "deleteComment", null);
__decorate([
    (0, common_1.Post)(':id/comments/:commentId/reply'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.TASKS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Add a threaded reply to a comment' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Param)('commentId')),
    __param(4, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, task_dto_1.CreateReplyDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "addReply", null);
__decorate([
    (0, common_1.Delete)(':id/comments/:commentId/reply/:replyId'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.TASKS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a threaded reply' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Param)('commentId')),
    __param(4, (0, common_1.Param)('replyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "deleteReply", null);
__decorate([
    (0, common_1.Post)(':id/comments/:commentId/react'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.TASKS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle an emoji reaction on a comment' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Param)('commentId')),
    __param(4, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, task_dto_1.ToggleReactionDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "toggleCommentReaction", null);
__decorate([
    (0, common_1.Post)(':id/comments/:commentId/reply/:replyId/react'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.TASKS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle an emoji reaction on a reply' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Param)('commentId')),
    __param(4, (0, common_1.Param)('replyId')),
    __param(5, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, task_dto_1.ToggleReactionDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "toggleReplyReaction", null);
__decorate([
    (0, common_1.Post)(':id/start-timer'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.TASKS_UPDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Start live time tracker on task' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "startTimer", null);
__decorate([
    (0, common_1.Post)(':id/stop-timer'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.TASKS_UPDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Stop live time tracker and log duration' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "stopTimer", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.TASKS_DELETE),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a task' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "delete", null);
exports.TasksController = TasksController = __decorate([
    (0, swagger_1.ApiTags)('Tasks & Projects'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('tasks'),
    __metadata("design:paramtypes", [tasks_service_1.TasksService])
], TasksController);
//# sourceMappingURL=tasks.controller.js.map