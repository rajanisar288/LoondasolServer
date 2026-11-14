import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, CreateSubtaskDto, UpdateSubtaskDto, CreateCommentDto, CreateReplyDto, ToggleReactionDto } from './dto/task.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { Task, TaskStatus } from './schemas/task.schema';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    findAll(tenant: TenantContext, user: JwtPayload, status?: TaskStatus, assigneeId?: string): Promise<Task[]>;
    findOne(tenant: TenantContext, id: string): Promise<Task>;
    create(tenant: TenantContext, user: JwtPayload, dto: CreateTaskDto): Promise<Task>;
    update(tenant: TenantContext, user: JwtPayload, id: string, dto: UpdateTaskDto): Promise<Task>;
    addSubtask(tenant: TenantContext, id: string, dto: CreateSubtaskDto): Promise<Task>;
    updateSubtask(tenant: TenantContext, id: string, subtaskId: string, dto: UpdateSubtaskDto): Promise<Task>;
    deleteSubtask(tenant: TenantContext, id: string, subtaskId: string): Promise<Task>;
    addComment(tenant: TenantContext, user: JwtPayload, id: string, dto: CreateCommentDto): Promise<Task>;
    deleteComment(tenant: TenantContext, user: JwtPayload, id: string, commentId: string): Promise<Task>;
    addReply(tenant: TenantContext, user: JwtPayload, id: string, commentId: string, dto: CreateReplyDto): Promise<Task>;
    deleteReply(tenant: TenantContext, user: JwtPayload, id: string, commentId: string, replyId: string): Promise<Task>;
    toggleCommentReaction(tenant: TenantContext, user: JwtPayload, id: string, commentId: string, dto: ToggleReactionDto): Promise<Task>;
    toggleReplyReaction(tenant: TenantContext, user: JwtPayload, id: string, commentId: string, replyId: string, dto: ToggleReactionDto): Promise<Task>;
    startTimer(tenant: TenantContext, user: JwtPayload, id: string): Promise<Task>;
    stopTimer(tenant: TenantContext, user: JwtPayload, id: string): Promise<Task>;
    delete(tenant: TenantContext, id: string): Promise<{
        success: boolean;
    }>;
}
