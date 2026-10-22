export declare class ClockInDto {
    notes?: string;
    ipAddress?: string;
}
export declare class ClockOutDto {
    notes?: string;
}
export declare class ManualAttendanceDto {
    date: string;
    clockInTime: string;
    clockOutTime?: string;
    notes?: string;
}
