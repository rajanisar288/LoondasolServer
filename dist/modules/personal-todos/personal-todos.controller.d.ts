import { PersonalTodosService } from './personal-todos.service';
import { CreatePersonalTodoDto, UpdatePersonalTodoDto } from './dto/personal-todo.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { PersonalTodo } from './schemas/personal-todo.schema';
export declare class PersonalTodosController {
    private readonly todosService;
    constructor(todosService: PersonalTodosService);
    findAll(tenant: TenantContext, user: JwtPayload): Promise<PersonalTodo[]>;
    create(tenant: TenantContext, user: JwtPayload, dto: CreatePersonalTodoDto): Promise<PersonalTodo>;
    update(tenant: TenantContext, user: JwtPayload, id: string, dto: UpdatePersonalTodoDto): Promise<PersonalTodo>;
    startTimer(tenant: TenantContext, user: JwtPayload, id: string): Promise<PersonalTodo>;
    pauseTimer(tenant: TenantContext, user: JwtPayload, id: string): Promise<PersonalTodo>;
    complete(tenant: TenantContext, user: JwtPayload, id: string): Promise<PersonalTodo>;
    delete(tenant: TenantContext, user: JwtPayload, id: string): Promise<{
        success: boolean;
    }>;
}
