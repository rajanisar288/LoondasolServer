import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { AiService } from '../ai/ai.service';
import { JwtPayload } from '../auth/jwt.strategy';
export interface SidebarCounts {
    employees: number;
    tasks: number;
    meetings: number;
    attendance: number;
    messages: number;
    expenses: number;
    todos: number;
    resignations: number;
}
export interface UpcomingMeetingItem {
    meetingId: string;
    title: string;
    startTime: Date;
    endTime: Date;
    meetingType: string;
    hostName: string;
    roomId: string;
    status: string;
}
export interface UpcomingBirthdayItem {
    employeeId: string;
    name: string;
    departmentName?: string;
    jobTitle?: string;
    dateOfBirth: string;
    daysUntil: number;
}
export interface UpcomingHolidayItem {
    name: string;
    date: string;
    dayOfWeek: string;
    type: string;
    daysUntil: number;
}
export interface TodayLateEmployeeItem {
    employeeId: string;
    employeeName: string;
    departmentName?: string;
    scheduledStartTime?: string;
    clockInTime: Date;
    minutesLate: number;
    status: string;
}
export interface EmployeeTaskItem {
    taskId: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: string;
    totalTimeSpentMinutes?: number;
}
export interface EmployeeAttendanceItem {
    date: string;
    clockInTime: Date;
    clockOutTime?: Date;
    totalHours: number;
    status: string;
    isLate: boolean;
    minutesLate: number;
}
export interface DashboardMetrics {
    totalEmployees: number;
    activeEmployees: number;
    employeesOnLeave: number;
    totalDepartments: number;
    pendingLeaves: number;
    openTasks: number;
    completedTasks: number;
    todayPresentCount?: number;
    todayAbsentCount?: number;
    todayLateCount?: number;
    subscription: {
        plan: string;
        status: string;
        trialEndsAt?: Date;
    };
    upcomingMeetings: UpcomingMeetingItem[];
    upcomingBirthdays: UpcomingBirthdayItem[];
    upcomingHolidays: UpcomingHolidayItem[];
    lateEmployees: TodayLateEmployeeItem[];
    isPersonalView?: boolean;
    myTasksCount?: number;
    myCompletedTasksCount?: number;
    myPendingLeavesCount?: number;
    myHoursLoggedThisMonth?: number;
}
export interface FilteredAnalytics {
    period: string;
    startDate?: string;
    endDate?: string;
    totalEmployees: number;
    activeEmployees: number;
    totalDepartments: number;
    attendanceTotal: number;
    onTimeCount: number;
    lateCount: number;
    onTimeRate: number;
    totalMinutesLate: number;
    averageMinutesLate: number;
    lateRecords: Array<{
        employeeName: string;
        date: string;
        clockInTime: Date;
        minutesLate: number;
    }>;
    openTasks: number;
    completedTasks: number;
    taskCompletionRate: number;
    departmentsSummary: Array<{
        departmentId: string;
        name: string;
        employeeCount: number;
    }>;
    employeeDetail?: {
        employeeId: string;
        name: string;
        email?: string;
        departmentName?: string;
        designation?: string;
    };
    employeeTasks?: EmployeeTaskItem[];
    attendanceHistory?: EmployeeAttendanceItem[];
}
export declare class ReportsService {
    private readonly regionalDbManager;
    private readonly aiService;
    constructor(regionalDbManager: RegionalDatabaseManager, aiService: AiService);
    getDashboardMetrics(tenant: TenantContext, query?: {
        period?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<DashboardMetrics>;
    private calculateUpcomingHolidays;
    getFilteredAnalytics(tenant: TenantContext, query: {
        period?: string;
        startDate?: string;
        endDate?: string;
        departmentId?: string;
        employeeId?: string;
    }): Promise<FilteredAnalytics>;
    generateAiReport(tenant: TenantContext, query: {
        period?: string;
        departmentId?: string;
    }): Promise<{
        reportMarkdown: string;
        modelUsed: string;
    }>;
    getSidebarCounts(tenant: TenantContext, user?: JwtPayload): Promise<SidebarCounts>;
}
