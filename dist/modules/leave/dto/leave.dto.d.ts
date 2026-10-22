import { LeaveType } from '../schemas/leave.schema';
export declare class ApplyLeaveDto {
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    daysCount: number;
    reason: string;
}
export declare class ReviewLeaveDto {
    notes?: string;
}
