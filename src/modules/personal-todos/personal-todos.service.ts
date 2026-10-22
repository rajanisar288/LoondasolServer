import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import {
  PersonalTodo,
  PersonalTodoSchema,
  PersonalTodoStatus,
} from './schemas/personal-todo.schema';
import {
  CreatePersonalTodoDto,
  UpdatePersonalTodoDto,
} from './dto/personal-todo.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@Injectable()
export class PersonalTodosService {
  constructor(private readonly regionalDbManager: RegionalDatabaseManager) {}

  async findAll(tenant: TenantContext, user: JwtPayload): Promise<PersonalTodo[]> {
    const model = await this.regionalDbManager.getModel<PersonalTodo>(
      tenant.region,
      PersonalTodo.name,
      PersonalTodoSchema,
    );

    return model
      .find({ companyId: tenant.companyId, userId: user.userId })
      .sort({ createdAt: -1 })
      .lean();
  }

  async create(
    tenant: TenantContext,
    user: JwtPayload,
    dto: CreatePersonalTodoDto,
  ): Promise<PersonalTodo> {
    const model = await this.regionalDbManager.getModel<PersonalTodo>(
      tenant.region,
      PersonalTodo.name,
      PersonalTodoSchema,
    );

    const todoId = `ptodo_${randomUUID()}`;
    return model.create({
      todoId,
      companyId: tenant.companyId,
      userId: user.userId,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      status: PersonalTodoStatus.PENDING,
      isRunning: false,
      intervals: [],
      totalDurationMinutes: 0,
    });
  }

  async update(
    tenant: TenantContext,
    user: JwtPayload,
    todoId: string,
    dto: UpdatePersonalTodoDto,
  ): Promise<PersonalTodo> {
    const model = await this.regionalDbManager.getModel<PersonalTodo>(
      tenant.region,
      PersonalTodo.name,
      PersonalTodoSchema,
    );

    const updated = await model
      .findOneAndUpdate(
        { companyId: tenant.companyId, userId: user.userId, todoId },
        { $set: dto },
        { new: true },
      )
      .lean();

    if (!updated) {
      throw new NotFoundException('Personal todo not found');
    }

    return updated;
  }

  async startTimer(
    tenant: TenantContext,
    user: JwtPayload,
    todoId: string,
  ): Promise<PersonalTodo> {
    const model = await this.regionalDbManager.getModel<PersonalTodo>(
      tenant.region,
      PersonalTodo.name,
      PersonalTodoSchema,
    );

    // Pause any other active timer for this user
    const activeRunning = await model.find({
      companyId: tenant.companyId,
      userId: user.userId,
      isRunning: true,
      todoId: { $ne: todoId },
    });

    const now = new Date();
    for (const active of activeRunning) {
      if (active.currentIntervalStartedAt) {
        const dur = Math.max(
          1,
          Math.round((now.getTime() - new Date(active.currentIntervalStartedAt).getTime()) / 60000),
        );
        active.intervals.push({
          intervalId: `int_${randomUUID()}`,
          start: active.currentIntervalStartedAt,
          end: now,
          durationMinutes: dur,
        });
        active.totalDurationMinutes = (active.totalDurationMinutes || 0) + dur;
      }
      active.isRunning = false;
      active.currentIntervalStartedAt = undefined;
      active.status = PersonalTodoStatus.PAUSED;
      await active.save();
    }

    const todo = await model.findOne({
      companyId: tenant.companyId,
      userId: user.userId,
      todoId,
    });

    if (!todo) {
      throw new NotFoundException('Personal todo not found');
    }

    todo.isRunning = true;
    todo.status = PersonalTodoStatus.IN_PROGRESS;
    todo.currentIntervalStartedAt = now;

    await todo.save();
    return todo.toObject();
  }

  async pauseTimer(
    tenant: TenantContext,
    user: JwtPayload,
    todoId: string,
  ): Promise<PersonalTodo> {
    const model = await this.regionalDbManager.getModel<PersonalTodo>(
      tenant.region,
      PersonalTodo.name,
      PersonalTodoSchema,
    );

    const todo = await model.findOne({
      companyId: tenant.companyId,
      userId: user.userId,
      todoId,
    });

    if (!todo) {
      throw new NotFoundException('Personal todo not found');
    }

    if (todo.isRunning && todo.currentIntervalStartedAt) {
      const now = new Date();
      const dur = Math.max(
        1,
        Math.round((now.getTime() - new Date(todo.currentIntervalStartedAt).getTime()) / 60000),
      );

      todo.intervals.push({
        intervalId: `int_${randomUUID()}`,
        start: todo.currentIntervalStartedAt,
        end: now,
        durationMinutes: dur,
      });

      todo.totalDurationMinutes = (todo.totalDurationMinutes || 0) + dur;
      todo.isRunning = false;
      todo.currentIntervalStartedAt = undefined;
      todo.status = PersonalTodoStatus.PAUSED;

      await todo.save();
    }

    return todo.toObject();
  }

  async complete(
    tenant: TenantContext,
    user: JwtPayload,
    todoId: string,
  ): Promise<PersonalTodo> {
    const model = await this.regionalDbManager.getModel<PersonalTodo>(
      tenant.region,
      PersonalTodo.name,
      PersonalTodoSchema,
    );

    const todo = await model.findOne({
      companyId: tenant.companyId,
      userId: user.userId,
      todoId,
    });

    if (!todo) {
      throw new NotFoundException('Personal todo not found');
    }

    if (todo.isRunning && todo.currentIntervalStartedAt) {
      const now = new Date();
      const dur = Math.max(
        1,
        Math.round((now.getTime() - new Date(todo.currentIntervalStartedAt).getTime()) / 60000),
      );

      todo.intervals.push({
        intervalId: `int_${randomUUID()}`,
        start: todo.currentIntervalStartedAt,
        end: now,
        durationMinutes: dur,
      });

      todo.totalDurationMinutes = (todo.totalDurationMinutes || 0) + dur;
      todo.currentIntervalStartedAt = undefined;
    }

    todo.isRunning = false;
    todo.status = PersonalTodoStatus.COMPLETED;

    await todo.save();
    return todo.toObject();
  }

  async delete(
    tenant: TenantContext,
    user: JwtPayload,
    todoId: string,
  ): Promise<{ success: boolean }> {
    const model = await this.regionalDbManager.getModel<PersonalTodo>(
      tenant.region,
      PersonalTodo.name,
      PersonalTodoSchema,
    );

    const result = await model.deleteOne({
      companyId: tenant.companyId,
      userId: user.userId,
      todoId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Personal todo not found');
    }

    return { success: true };
  }
}
