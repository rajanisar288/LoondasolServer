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
exports.PersonalTodosService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const personal_todo_schema_1 = require("./schemas/personal-todo.schema");
let PersonalTodosService = class PersonalTodosService {
    constructor(regionalDbManager) {
        this.regionalDbManager = regionalDbManager;
    }
    async findAll(tenant, user) {
        const model = await this.regionalDbManager.getModel(tenant.region, personal_todo_schema_1.PersonalTodo.name, personal_todo_schema_1.PersonalTodoSchema);
        return model
            .find({ companyId: tenant.companyId, userId: user.userId })
            .sort({ createdAt: -1 })
            .lean();
    }
    async create(tenant, user, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, personal_todo_schema_1.PersonalTodo.name, personal_todo_schema_1.PersonalTodoSchema);
        const todoId = `ptodo_${(0, crypto_1.randomUUID)()}`;
        return model.create({
            todoId,
            companyId: tenant.companyId,
            userId: user.userId,
            title: dto.title.trim(),
            description: dto.description?.trim(),
            status: personal_todo_schema_1.PersonalTodoStatus.PENDING,
            isRunning: false,
            intervals: [],
            totalDurationMinutes: 0,
        });
    }
    async update(tenant, user, todoId, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, personal_todo_schema_1.PersonalTodo.name, personal_todo_schema_1.PersonalTodoSchema);
        const updated = await model
            .findOneAndUpdate({ companyId: tenant.companyId, userId: user.userId, todoId }, { $set: dto }, { new: true })
            .lean();
        if (!updated) {
            throw new common_1.NotFoundException('Personal todo not found');
        }
        return updated;
    }
    async startTimer(tenant, user, todoId) {
        const model = await this.regionalDbManager.getModel(tenant.region, personal_todo_schema_1.PersonalTodo.name, personal_todo_schema_1.PersonalTodoSchema);
        const activeRunning = await model.find({
            companyId: tenant.companyId,
            userId: user.userId,
            isRunning: true,
            todoId: { $ne: todoId },
        });
        const now = new Date();
        for (const active of activeRunning) {
            if (active.currentIntervalStartedAt) {
                const dur = Math.max(1, Math.round((now.getTime() - new Date(active.currentIntervalStartedAt).getTime()) / 60000));
                active.intervals.push({
                    intervalId: `int_${(0, crypto_1.randomUUID)()}`,
                    start: active.currentIntervalStartedAt,
                    end: now,
                    durationMinutes: dur,
                });
                active.totalDurationMinutes = (active.totalDurationMinutes || 0) + dur;
            }
            active.isRunning = false;
            active.currentIntervalStartedAt = undefined;
            active.status = personal_todo_schema_1.PersonalTodoStatus.PAUSED;
            await active.save();
        }
        const todo = await model.findOne({
            companyId: tenant.companyId,
            userId: user.userId,
            todoId,
        });
        if (!todo) {
            throw new common_1.NotFoundException('Personal todo not found');
        }
        todo.isRunning = true;
        todo.status = personal_todo_schema_1.PersonalTodoStatus.IN_PROGRESS;
        todo.currentIntervalStartedAt = now;
        await todo.save();
        return todo.toObject();
    }
    async pauseTimer(tenant, user, todoId) {
        const model = await this.regionalDbManager.getModel(tenant.region, personal_todo_schema_1.PersonalTodo.name, personal_todo_schema_1.PersonalTodoSchema);
        const todo = await model.findOne({
            companyId: tenant.companyId,
            userId: user.userId,
            todoId,
        });
        if (!todo) {
            throw new common_1.NotFoundException('Personal todo not found');
        }
        if (todo.isRunning && todo.currentIntervalStartedAt) {
            const now = new Date();
            const dur = Math.max(1, Math.round((now.getTime() - new Date(todo.currentIntervalStartedAt).getTime()) / 60000));
            todo.intervals.push({
                intervalId: `int_${(0, crypto_1.randomUUID)()}`,
                start: todo.currentIntervalStartedAt,
                end: now,
                durationMinutes: dur,
            });
            todo.totalDurationMinutes = (todo.totalDurationMinutes || 0) + dur;
            todo.isRunning = false;
            todo.currentIntervalStartedAt = undefined;
            todo.status = personal_todo_schema_1.PersonalTodoStatus.PAUSED;
            await todo.save();
        }
        return todo.toObject();
    }
    async complete(tenant, user, todoId) {
        const model = await this.regionalDbManager.getModel(tenant.region, personal_todo_schema_1.PersonalTodo.name, personal_todo_schema_1.PersonalTodoSchema);
        const todo = await model.findOne({
            companyId: tenant.companyId,
            userId: user.userId,
            todoId,
        });
        if (!todo) {
            throw new common_1.NotFoundException('Personal todo not found');
        }
        if (todo.isRunning && todo.currentIntervalStartedAt) {
            const now = new Date();
            const dur = Math.max(1, Math.round((now.getTime() - new Date(todo.currentIntervalStartedAt).getTime()) / 60000));
            todo.intervals.push({
                intervalId: `int_${(0, crypto_1.randomUUID)()}`,
                start: todo.currentIntervalStartedAt,
                end: now,
                durationMinutes: dur,
            });
            todo.totalDurationMinutes = (todo.totalDurationMinutes || 0) + dur;
            todo.currentIntervalStartedAt = undefined;
        }
        todo.isRunning = false;
        todo.status = personal_todo_schema_1.PersonalTodoStatus.COMPLETED;
        await todo.save();
        return todo.toObject();
    }
    async delete(tenant, user, todoId) {
        const model = await this.regionalDbManager.getModel(tenant.region, personal_todo_schema_1.PersonalTodo.name, personal_todo_schema_1.PersonalTodoSchema);
        const result = await model.deleteOne({
            companyId: tenant.companyId,
            userId: user.userId,
            todoId,
        });
        if (result.deletedCount === 0) {
            throw new common_1.NotFoundException('Personal todo not found');
        }
        return { success: true };
    }
};
exports.PersonalTodosService = PersonalTodosService;
exports.PersonalTodosService = PersonalTodosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [regional_database_manager_1.RegionalDatabaseManager])
], PersonalTodosService);
//# sourceMappingURL=personal-todos.service.js.map