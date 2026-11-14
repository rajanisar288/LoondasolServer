import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Task, TaskStatus } from './schemas/task.schema';
import { CreateTaskDto, UpdateTaskDto, CreateSubtaskDto, UpdateSubtaskDto, CreateCommentDto, CreateReplyDto } from './dto/task.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { NotificationsService } from '../notifications/notifications.service';
export declare class TasksService {
    private readonly regionalDbManager;
    private readonly notificationsService;
    private readonly logger;
    constructor(regionalDbManager: RegionalDatabaseManager, notificationsService: NotificationsService);
    findAll(tenant: TenantContext, user: JwtPayload, filters?: {
        status?: TaskStatus;
        assigneeId?: string;
    }): Promise<Task[]>;
    findOne(tenant: TenantContext, taskId: string): Promise<Task>;
    create(tenant: TenantContext, user: JwtPayload, dto: CreateTaskDto): Promise<Task>;
    update(tenant: TenantContext, taskId: string, dto: UpdateTaskDto, user?: JwtPayload): Promise<Task>;
    startTimer(tenant: TenantContext, user: JwtPayload, taskId: string): Promise<Task>;
    stopTimer(tenant: TenantContext, user: JwtPayload, taskId: string): Promise<Task>;
    delete(tenant: TenantContext, taskId: string): Promise<{
        success: boolean;
    }>;
    addSubtask(tenant: TenantContext, taskId: string, dto: CreateSubtaskDto): Promise<Task>;
    updateSubtask(tenant: TenantContext, taskId: string, subtaskId: string, dto: UpdateSubtaskDto): Promise<Task>;
    deleteSubtask(tenant: TenantContext, taskId: string, subtaskId: string): Promise<Task>;
    private getUserProfile;
    private notifyTaskMembers;
    addComment(tenant: TenantContext, user: JwtPayload, taskId: string, dto: CreateCommentDto): Promise<Task>;
    addReply(tenant: TenantContext, user: JwtPayload, taskId: string, commentId: string, dto: CreateReplyDto): Promise<Task>;
    deleteComment(tenant: TenantContext, user: JwtPayload, taskId: string, commentId: string): Promise<Task>;
    deleteReply(tenant: TenantContext, user: JwtPayload, taskId: string, commentId: string, replyId: string): Promise<Task>;
    toggleReaction(tenant: TenantContext, user: JwtPayload, taskId: string, commentId: string, emoji: string, replyId?: string): Promise<Task>;
}
