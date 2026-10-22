import { Document } from 'mongoose';
export type PersonalTodoDocument = PersonalTodo & Document;
export declare enum PersonalTodoStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    PAUSED = "PAUSED",
    COMPLETED = "COMPLETED"
}
export declare class TimeInterval {
    intervalId: string;
    start: Date;
    end?: Date;
    durationMinutes: number;
}
export declare class PersonalTodo {
    todoId: string;
    companyId: string;
    userId: string;
    title: string;
    description?: string;
    status: PersonalTodoStatus;
    isRunning: boolean;
    currentIntervalStartedAt?: Date;
    intervals: TimeInterval[];
    totalDurationMinutes: number;
}
export declare const PersonalTodoSchema: import("mongoose").Schema<PersonalTodo, import("mongoose").Model<PersonalTodo, any, any, any, Document<unknown, any, PersonalTodo, any, {}> & PersonalTodo & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PersonalTodo, Document<unknown, {}, import("mongoose").FlatRecord<PersonalTodo>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<PersonalTodo> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
