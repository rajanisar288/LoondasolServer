import { PersonalTodoStatus } from '../schemas/personal-todo.schema';
export declare class CreatePersonalTodoDto {
    title: string;
    description?: string;
}
export declare class UpdatePersonalTodoDto {
    title?: string;
    description?: string;
    status?: PersonalTodoStatus;
}
