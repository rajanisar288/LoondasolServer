import { Document } from 'mongoose';
export type ExpenseDocument = Expense & Document;
export declare enum ExpenseStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REIMBURSED = "REIMBURSED",
    REJECTED = "REJECTED"
}
export declare class Expense {
    expenseId: string;
    companyId: string;
    branchId?: string;
    branchName?: string;
    title: string;
    category: string;
    amount: number;
    currency: string;
    date: string;
    receiptUrl?: string;
    paidByUserId: string;
    paidByName: string;
    notes?: string;
    status: ExpenseStatus;
    approvedBy?: string;
    approvedAt?: Date;
}
export declare const ExpenseSchema: import("mongoose").Schema<Expense, import("mongoose").Model<Expense, any, any, any, Document<unknown, any, Expense, any, {}> & Expense & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Expense, Document<unknown, {}, import("mongoose").FlatRecord<Expense>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Expense> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
