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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskSchema = exports.Task = exports.TaskComment = exports.CommentReply = exports.CommentReaction = exports.TaskSubtask = exports.TaskTimeLog = exports.TaskAssignee = exports.TaskPriority = exports.TaskStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["TODO"] = "TODO";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["IN_REVIEW"] = "IN_REVIEW";
    TaskStatus["COMPLETED"] = "COMPLETED";
    TaskStatus["LAUNCHED"] = "LAUNCHED";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "LOW";
    TaskPriority["MEDIUM"] = "MEDIUM";
    TaskPriority["HIGH"] = "HIGH";
    TaskPriority["URGENT"] = "URGENT";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
let TaskAssignee = class TaskAssignee {
};
exports.TaskAssignee = TaskAssignee;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TaskAssignee.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TaskAssignee.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], TaskAssignee.prototype, "avatarUrl", void 0);
exports.TaskAssignee = TaskAssignee = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], TaskAssignee);
let TaskTimeLog = class TaskTimeLog {
};
exports.TaskTimeLog = TaskTimeLog;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TaskTimeLog.prototype, "logId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TaskTimeLog.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TaskTimeLog.prototype, "userName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], TaskTimeLog.prototype, "startTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], TaskTimeLog.prototype, "endTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], TaskTimeLog.prototype, "durationMinutes", void 0);
exports.TaskTimeLog = TaskTimeLog = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], TaskTimeLog);
let TaskSubtask = class TaskSubtask {
};
exports.TaskSubtask = TaskSubtask;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TaskSubtask.prototype, "subtaskId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], TaskSubtask.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], TaskSubtask.prototype, "isCompleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: Date.now }),
    __metadata("design:type", Date)
], TaskSubtask.prototype, "createdAt", void 0);
exports.TaskSubtask = TaskSubtask = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], TaskSubtask);
let CommentReaction = class CommentReaction {
};
exports.CommentReaction = CommentReaction;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CommentReaction.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CommentReaction.prototype, "userName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CommentReaction.prototype, "emoji", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: Date.now }),
    __metadata("design:type", Date)
], CommentReaction.prototype, "createdAt", void 0);
exports.CommentReaction = CommentReaction = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], CommentReaction);
let CommentReply = class CommentReply {
};
exports.CommentReply = CommentReply;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CommentReply.prototype, "replyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CommentReply.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CommentReply.prototype, "userName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], CommentReply.prototype, "userAvatar", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CommentReply.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [CommentReaction], default: [] }),
    __metadata("design:type", Array)
], CommentReply.prototype, "reactions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: Date.now }),
    __metadata("design:type", Date)
], CommentReply.prototype, "createdAt", void 0);
exports.CommentReply = CommentReply = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], CommentReply);
let TaskComment = class TaskComment {
};
exports.TaskComment = TaskComment;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TaskComment.prototype, "commentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TaskComment.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TaskComment.prototype, "userName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], TaskComment.prototype, "userAvatar", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TaskComment.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [CommentReaction], default: [] }),
    __metadata("design:type", Array)
], TaskComment.prototype, "reactions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [CommentReply], default: [] }),
    __metadata("design:type", Array)
], TaskComment.prototype, "replies", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: Date.now }),
    __metadata("design:type", Date)
], TaskComment.prototype, "createdAt", void 0);
exports.TaskComment = TaskComment = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], TaskComment);
let Task = class Task {
};
exports.Task = Task;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], Task.prototype, "taskId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Task.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Task.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Task.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(TaskStatus),
        default: TaskStatus.TODO,
        index: true,
    }),
    __metadata("design:type", String)
], Task.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(TaskPriority),
        default: TaskPriority.MEDIUM,
    }),
    __metadata("design:type", String)
], Task.prototype, "priority", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, index: true }),
    __metadata("design:type", String)
], Task.prototype, "assigneeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Task.prototype, "assigneeName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [TaskAssignee], default: [] }),
    __metadata("design:type", Array)
], Task.prototype, "assignees", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], Task.prototype, "dueDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Task.prototype, "createdBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [TaskTimeLog], default: [] }),
    __metadata("design:type", Array)
], Task.prototype, "timeLogs", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], Task.prototype, "totalSpentMinutes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: false }),
    __metadata("design:type", Boolean)
], Task.prototype, "isTimerRunning", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Task.prototype, "activeTimerUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], Task.prototype, "activeTimerStartTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [TaskSubtask], default: [] }),
    __metadata("design:type", Array)
], Task.prototype, "subtasks", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [TaskComment], default: [] }),
    __metadata("design:type", Array)
], Task.prototype, "comments", void 0);
exports.Task = Task = __decorate([
    (0, mongoose_1.Schema)({ collection: 'tasks', timestamps: true })
], Task);
exports.TaskSchema = mongoose_1.SchemaFactory.createForClass(Task);
exports.TaskSchema.index({ companyId: 1, status: 1 });
exports.TaskSchema.index({ companyId: 1, 'assignees.userId': 1 });
exports.TaskSchema.index({ companyId: 1, assigneeId: 1 });
//# sourceMappingURL=task.schema.js.map