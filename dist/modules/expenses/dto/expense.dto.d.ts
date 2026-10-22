import { ExpenseStatus } from '../schemas/expense.schema';
export declare class CreateExpenseDto {
    title: string;
    category: string;
    amount: number;
    currency?: string;
    date: string;
    branchId?: string;
    branchName?: string;
    receiptUrl?: string;
    notes?: string;
}
export declare class UpdateExpenseStatusDto {
    status: ExpenseStatus;
}
