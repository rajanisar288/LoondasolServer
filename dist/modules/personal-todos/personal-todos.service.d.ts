import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { PersonalTodo } from './schemas/personal-todo.schema';
import { CreatePersonalTodoDto, UpdatePersonalTodoDto } from './dto/personal-todo.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class PersonalTodosService {
    private readonly regionalDbManager;
    constructor(regionalDbManager: RegionalDatabaseManager);
    findAll(tenant: TenantContext, user: JwtPayload): Promise<PersonalTodo[]>;
    create(tenant: TenantContext, user: JwtPayload, dto: CreatePersonalTodoDto): Promise<PersonalTodo>;
    update(tenant: TenantContext, user: JwtPayload, todoId: string, dto: UpdatePersonalTodoDto): Promise<PersonalTodo>;
    startTimer(tenant: TenantContext, user: JwtPayload, todoId: string): Promise<PersonalTodo>;
    pauseTimer(tenant: TenantContext, user: JwtPayload, todoId: string): Promise<PersonalTodo>;
    complete(tenant: TenantContext, user: JwtPayload, todoId: string): Promise<PersonalTodo>;
    delete(tenant: TenantContext, user: JwtPayload, todoId: string): Promise<{
        success: boolean;
    }>;
}
