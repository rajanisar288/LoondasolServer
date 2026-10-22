import { Injectable } from '@nestjs/common';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import {
  Employee,
  EmployeeSchema,
  EmployeeStatus,
} from '../employees/schemas/employee.schema';
import {
  Department,
  DepartmentSchema,
} from '../departments/schemas/department.schema';
import { Leave, LeaveSchema, LeaveStatus } from '../leave/schemas/leave.schema';
import { Task, TaskSchema, TaskStatus } from '../tasks/schemas/task.schema';
import { Company, CompanySchema } from '../companies/schemas/company.schema';

import {
  Attendance,
  AttendanceSchema,
  AttendanceStatus,
} from '../attendance/schemas/attendance.schema';
import {
  Meeting,
  MeetingSchema,
  MeetingStatus,
} from '../meetings/schemas/meeting.schema';
import { AiService } from '../ai/ai.service';
import { Expense, ExpenseSchema, ExpenseStatus } from '../expenses/schemas/expense.schema';
import { Resignation, ResignationSchema, ResignationStatus } from '../resignations/schemas/resignation.schema';
import { PersonalTodo, PersonalTodoSchema } from '../personal-todos/schemas/personal-todo.schema';
import { Message, MessageSchema } from '../chat/schemas/message.schema';
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

@Injectable()
export class ReportsService {
  constructor(
    private readonly regionalDbManager: RegionalDatabaseManager,
    private readonly aiService: AiService,
  ) {}

  // Computes permission-aware real-time KPI metrics for dashboard with period filters
  async getDashboardMetrics(
    tenant: TenantContext,
    query?: { period?: string; startDate?: string; endDate?: string },
  ): Promise<DashboardMetrics> {
    const employeeModel = await this.regionalDbManager.getModel<Employee>(
      tenant.region,
      Employee.name,
      EmployeeSchema,
    );
    const departmentModel = await this.regionalDbManager.getModel<Department>(
      tenant.region,
      Department.name,
      DepartmentSchema,
    );
    const leaveModel = await this.regionalDbManager.getModel<Leave>(
      tenant.region,
      Leave.name,
      LeaveSchema,
    );
    const taskModel = await this.regionalDbManager.getModel<Task>(
      tenant.region,
      Task.name,
      TaskSchema,
    );
    const companyModel = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );
    const meetingModel = await this.regionalDbManager.getModel<Meeting>(
      tenant.region,
      Meeting.name,
      MeetingSchema,
    );
    const attendanceModel = await this.regionalDbManager.getModel<Attendance>(
      tenant.region,
      Attendance.name,
      AttendanceSchema,
    );

    const now = new Date();
    const currentYear = now.getFullYear();
    const todayStr = now.toISOString().slice(0, 10);
    const startOfMonth = new Date(currentYear, now.getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().slice(0, 10);

    const isOwner = tenant.role === 'OWNER';
    const hasReportPerms =
      isOwner ||
      tenant.permissions?.includes('reports.view') ||
      tenant.permissions?.includes('employees.view');

    // 1. Fetch common models: company, birthdays, holidays
    const [company, rawMeetings, employeesWithDob] = await Promise.all([
      companyModel.findOne({ companyId: tenant.companyId }).lean(),
      meetingModel
        .find({
          companyId: tenant.companyId,
          status: { $in: [MeetingStatus.SCHEDULED, MeetingStatus.IN_PROGRESS] },
          startTime: { $gte: new Date(Date.now() - 4 * 3600000) },
        })
        .sort({ startTime: 1 })
        .limit(5)
        .lean(),
      employeeModel
        .find({
          companyId: tenant.companyId,
          status: EmployeeStatus.ACTIVE,
          dateOfBirth: { $exists: true, $ne: '' },
        })
        .select(
          'employeeId firstName lastName departmentName designation dateOfBirth',
        )
        .lean(),
    ]);

    const upcomingBirthdays: UpcomingBirthdayItem[] = [];
    for (const emp of employeesWithDob || []) {
      if (!emp.dateOfBirth) continue;
      const parts = emp.dateOfBirth.split('-');
      if (parts.length < 3) continue;
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (isNaN(month) || isNaN(day)) continue;

      let nextBirthday = new Date(currentYear, month - 1, day);
      if (nextBirthday.getTime() < now.getTime() - 86400000) {
        nextBirthday = new Date(currentYear + 1, month - 1, day);
      }
      const diffMs = nextBirthday.getTime() - now.getTime();
      const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      upcomingBirthdays.push({
        employeeId: emp.employeeId,
        name: `${emp.firstName} ${emp.lastName}`.trim(),
        departmentName: emp.departmentName || 'General',
        jobTitle: emp.designation || 'Team Member',
        dateOfBirth: emp.dateOfBirth,
        daysUntil,
      });
    }
    upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);
    const topBirthdays = upcomingBirthdays.slice(0, 5);

    const upcomingMeetings: UpcomingMeetingItem[] = (rawMeetings || []).map(
      (m: any) => ({
        meetingId: m.meetingId,
        title: m.title,
        startTime: m.startTime,
        endTime: m.endTime,
        meetingType: m.meetingType,
        hostName: m.hostName,
        roomId: m.roomId,
        status: m.status,
      }),
    );

    const upcomingHolidays = this.calculateUpcomingHolidays();

    // If standard employee without company-wide report permissions: return personal overview
    if (!hasReportPerms) {
      const [myAssignedTasks, myPendingLeaves, myAttendanceThisMonth, myEmployee] =
        await Promise.all([
          taskModel
            .find({
              companyId: tenant.companyId,
              $or: [
                { assigneeId: tenant.userId },
                { 'assignees.userId': tenant.userId },
                { createdBy: tenant.userId },
              ],
            })
            .lean(),
          leaveModel.countDocuments({
            companyId: tenant.companyId,
            userId: tenant.userId,
            status: LeaveStatus.PENDING,
          }),
          attendanceModel
            .find({
              companyId: tenant.companyId,
              userId: tenant.userId,
              date: { $gte: startOfMonthStr },
            })
            .lean(),
          employeeModel
            .findOne({
              companyId: tenant.companyId,
              userId: tenant.userId,
            })
            .lean(),
        ]);

      const myTasksCount = myAssignedTasks.filter(
        (t) => t.status !== TaskStatus.COMPLETED,
      ).length;
      const myCompletedTasksCount = myAssignedTasks.filter(
        (t) => t.status === TaskStatus.COMPLETED,
      ).length;
      const myHoursLogged = Math.round(
        myAttendanceThisMonth.reduce(
          (acc, curr) => acc + (curr.totalHours || 0),
          0,
        ) * 10,
      ) / 10;
      const clockedInToday = myAttendanceThisMonth.some(
        (r) => r.date === todayStr,
      );
      const myLateToday = myAttendanceThisMonth.find(
        (r) => r.date === todayStr && (r.isLate || r.status === AttendanceStatus.LATE),
      );
      const personalLateEmployees: TodayLateEmployeeItem[] = myLateToday
        ? [
            {
              employeeId: myLateToday.employeeId || myEmployee?.employeeId || '',
              employeeName: myLateToday.employeeName || `${myEmployee?.firstName || ''} ${myEmployee?.lastName || ''}`.trim(),
              departmentName: myEmployee?.departmentName || 'My Department',
              scheduledStartTime: myLateToday.scheduledStartTime || '09:00',
              clockInTime: myLateToday.clockInTime,
              minutesLate: myLateToday.minutesLate || 0,
              status: myLateToday.status,
            },
          ]
        : [];

      return {
        isPersonalView: true,
        totalEmployees: 0,
        activeEmployees: 0,
        employeesOnLeave: 0,
        totalDepartments: 0,
        pendingLeaves: myPendingLeaves,
        openTasks: myTasksCount,
        completedTasks: myCompletedTasksCount,
        todayPresentCount: clockedInToday ? 1 : 0,
        todayAbsentCount: clockedInToday ? 0 : 1,
        todayLateCount: myLateToday ? 1 : 0,
        myTasksCount,
        myCompletedTasksCount,
        myPendingLeavesCount: myPendingLeaves,
        myHoursLoggedThisMonth: myHoursLogged,
        subscription: {
          plan: company?.subscription?.plan || 'FREE_TRIAL',
          status: company?.subscription?.status || 'TRIALING',
          trialEndsAt: company?.subscription?.trialEndsAt,
        },
        upcomingMeetings,
        upcomingBirthdays: topBirthdays,
        upcomingHolidays,
        lateEmployees: personalLateEmployees,
      };
    }

    // Manager / Owner company-wide metrics
    const period = query?.period || 'today';
    let taskDateFilter: Record<string, any> | undefined;

    if (period === 'today') {
      taskDateFilter = {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      };
    } else if (period === 'weekly' || period === 'this_week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      taskDateFilter = { $gte: d };
    } else if (period === 'monthly' || period === 'this_month') {
      taskDateFilter = { $gte: startOfMonth };
    } else if (period === 'custom' && query?.startDate) {
      const start = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        taskDateFilter = { $gte: start, $lte: end };
      } else {
        taskDateFilter = { $gte: start };
      }
    }

    const taskMatch: Record<string, any> = { companyId: tenant.companyId };
    if (taskDateFilter) {
      taskMatch['createdAt'] = taskDateFilter;
    }

    const [
      totalEmployees,
      activeEmployees,
      employeesOnLeave,
      totalDepartments,
      pendingLeaves,
      openTasks,
      completedTasks,
      todayAttendanceRecords,
    ] = await Promise.all([
      employeeModel.countDocuments({ companyId: tenant.companyId }),
      employeeModel.countDocuments({
        companyId: tenant.companyId,
        status: EmployeeStatus.ACTIVE,
      }),
      employeeModel.countDocuments({
        companyId: tenant.companyId,
        status: EmployeeStatus.ON_LEAVE,
      }),
      departmentModel.countDocuments({ companyId: tenant.companyId }),
      leaveModel.countDocuments({
        companyId: tenant.companyId,
        status: LeaveStatus.PENDING,
      }),
      taskModel.countDocuments({
        companyId: tenant.companyId,
        status: { $ne: TaskStatus.COMPLETED },
        ...(taskDateFilter ? { createdAt: taskDateFilter } : {}),
      }),
      taskModel.countDocuments({
        companyId: tenant.companyId,
        status: TaskStatus.COMPLETED,
        ...(taskDateFilter ? { createdAt: taskDateFilter } : {}),
      }),
      attendanceModel
        .find({
          companyId: tenant.companyId,
          date: todayStr,
        })
        .lean(),
    ]);

    const todayPresentCount = todayAttendanceRecords.length;
    const todayLateRecords = todayAttendanceRecords.filter(
      (r) =>
        r.status === AttendanceStatus.LATE ||
        r.isLate ||
        (r.minutesLate && r.minutesLate > 0),
    );
    const todayLateCount = todayLateRecords.length;
    const todayAbsentCount = Math.max(0, activeEmployees - todayPresentCount);

    const empDeptMap = new Map<string, string>();
    for (const e of employeesWithDob || []) {
      if (e.departmentName) empDeptMap.set(e.employeeId, e.departmentName);
    }

    const lateEmployees: TodayLateEmployeeItem[] = todayLateRecords.map((r) => {
      let dept = (r as any).departmentName;
      if (!dept || dept === 'General Staff') {
        dept = empDeptMap.get(r.employeeId) || 'General Staff';
      }
      return {
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        departmentName: dept,
        scheduledStartTime: r.scheduledStartTime || '09:00 AM',
        clockInTime: r.clockInTime,
        minutesLate: r.minutesLate || 15,
        status: r.status || 'LATE',
      };
    });

    return {
      isPersonalView: false,
      totalEmployees,
      activeEmployees,
      employeesOnLeave,
      totalDepartments,
      pendingLeaves,
      openTasks,
      completedTasks,
      todayPresentCount,
      todayAbsentCount,
      todayLateCount,
      subscription: {
        plan: company?.subscription?.plan || 'FREE_TRIAL',
        status: company?.subscription?.status || 'TRIALING',
        trialEndsAt: company?.subscription?.trialEndsAt,
      },
      upcomingMeetings,
      upcomingBirthdays: topBirthdays,
      upcomingHolidays,
      lateEmployees,
    };
  }

  // Calculate standard upcoming national and corporate holidays
  private calculateUpcomingHolidays(): UpcomingHolidayItem[] {
    const currentYear = new Date().getFullYear();
    const holidays = [
      { name: "New Year's Day", month: 1, day: 1, type: 'Public Holiday' },
      {
        name: "International Women's Day",
        month: 3,
        day: 8,
        type: 'Observance',
      },
      { name: 'Labor Day', month: 5, day: 1, type: 'Public Holiday' },
      { name: 'World Environment Day', month: 6, day: 5, type: 'Observance' },
      { name: 'Independence Day', month: 8, day: 14, type: 'National Holiday' },
      {
        name: 'International Peace Day',
        month: 9,
        day: 21,
        type: 'Observance',
      },
      {
        name: 'World Mental Health Day',
        month: 10,
        day: 10,
        type: 'Observance',
      },
      { name: 'Quaid-e-Azam Day', month: 12, day: 25, type: 'Public Holiday' },
    ];

    const now = new Date();
    const upcoming: UpcomingHolidayItem[] = [];

    for (const h of holidays) {
      let holidayDate = new Date(currentYear, h.month - 1, h.day);
      if (holidayDate.getTime() < now.getTime() - 86400000) {
        holidayDate = new Date(currentYear + 1, h.month - 1, h.day);
      }
      const diffMs = holidayDate.getTime() - now.getTime();
      const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const dayOfWeek = holidayDate.toLocaleDateString('en-US', {
        weekday: 'short',
      });
      const formattedDate = holidayDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      upcoming.push({
        name: h.name,
        date: formattedDate,
        dayOfWeek,
        type: h.type,
        daysUntil,
      });
    }

    upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
    return upcoming.slice(0, 5);
  }

  // Analytics with date range, department, and single employee drill-down
  async getFilteredAnalytics(
    tenant: TenantContext,
    query: {
      period?: string;
      startDate?: string;
      endDate?: string;
      departmentId?: string;
      employeeId?: string;
    },
  ): Promise<FilteredAnalytics> {
    const employeeModel = await this.regionalDbManager.getModel<Employee>(
      tenant.region,
      Employee.name,
      EmployeeSchema,
    );
    const departmentModel = await this.regionalDbManager.getModel<Department>(
      tenant.region,
      Department.name,
      DepartmentSchema,
    );
    const attendanceModel = await this.regionalDbManager.getModel<Attendance>(
      tenant.region,
      Attendance.name,
      AttendanceSchema,
    );
    const taskModel = await this.regionalDbManager.getModel<Task>(
      tenant.region,
      Task.name,
      TaskSchema,
    );

    const period = query.period || 'this_month';
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    let dateFilter: Record<string, any> | undefined;

    if (period === 'today') {
      dateFilter = { $eq: todayStr };
    } else if (period === 'this_week' || period === '7days') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 7);
      dateFilter = { $gte: past7.toISOString().slice(0, 10) };
    } else if (period === 'this_month' || period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { $gte: startOfMonth.toISOString().slice(0, 10) };
    } else if (period === 'last_month') {
      const startOfLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLast = new Date(now.getFullYear(), now.getMonth(), 0);
      dateFilter = {
        $gte: startOfLast.toISOString().slice(0, 10),
        $lte: endOfLast.toISOString().slice(0, 10),
      };
    } else if (period === '30days') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      dateFilter = { $gte: past30.toISOString().slice(0, 10) };
    } else if (period === 'custom' && (query.startDate || query.endDate)) {
      if (query.startDate && query.endDate) {
        dateFilter = { $gte: query.startDate, $lte: query.endDate };
      } else if (query.startDate) {
        dateFilter = { $gte: query.startDate };
      } else if (query.endDate) {
        dateFilter = { $lte: query.endDate };
      }
    }

    // 1. Resolve employee filter (force caller's own employee ID if lacking company-wide view permissions)
    const isOwner = tenant.role === 'OWNER';
    const canViewAllReports =
      isOwner ||
      tenant.role === 'ADMIN' ||
      tenant.permissions?.includes('reports.view');

    if (!canViewAllReports) {
      const myEmp = await employeeModel
        .findOne({ companyId: tenant.companyId, userId: tenant.userId })
        .lean();
      if (myEmp) {
        query.employeeId = myEmp.employeeId;
        query.departmentId = undefined;
      }
    }

    let employeeIds: string[] | undefined;
    let singleEmployeeDoc: any = null;

    if (query.employeeId) {
      singleEmployeeDoc = await employeeModel
        .findOne({ companyId: tenant.companyId, employeeId: query.employeeId })
        .lean();
      employeeIds = [query.employeeId];
    } else if (query.departmentId) {
      const deptEmps = await employeeModel
        .find(
          { companyId: tenant.companyId, departmentId: query.departmentId },
          { employeeId: 1 },
        )
        .lean();
      employeeIds = deptEmps.map((e) => e.employeeId);
    }

    // 2. Attendance Query
    const attFilter: Record<string, any> = { companyId: tenant.companyId };
    if (dateFilter) attFilter['date'] = dateFilter;
    if (employeeIds) attFilter['employeeId'] = { $in: employeeIds };

    // 3. Task Query
    const taskQuery: Record<string, any> = { companyId: tenant.companyId };
    if (singleEmployeeDoc) {
      taskQuery['$or'] = [
        { 'assignees.userId': singleEmployeeDoc.userId },
        { 'assignees.userId': singleEmployeeDoc.employeeId },
      ];
    } else if (employeeIds && employeeIds.length > 0) {
      taskQuery['assignees.userId'] = { $in: employeeIds };
    }

    const [
      totalEmployees,
      activeEmployees,
      totalDepartments,
      attendanceTotal,
      lateCount,
      lateRecordsRaw,
      tasksRaw,
      departmentsRaw,
      attendanceHistoryRaw,
    ] = await Promise.all([
      employeeModel.countDocuments({ companyId: tenant.companyId }),
      employeeModel.countDocuments({
        companyId: tenant.companyId,
        status: EmployeeStatus.ACTIVE,
      }),
      departmentModel.countDocuments({ companyId: tenant.companyId }),
      attendanceModel.countDocuments(attFilter),
      attendanceModel.countDocuments({
        ...attFilter,
        $or: [{ status: AttendanceStatus.LATE }, { isLate: true }],
      }),
      attendanceModel
        .find({
          ...attFilter,
          $or: [{ status: AttendanceStatus.LATE }, { isLate: true }],
        })
        .sort({ date: -1, minutesLate: -1 })
        .limit(20)
        .lean(),
      taskModel.find(taskQuery).sort({ updatedAt: -1 }).limit(50).lean(),
      departmentModel.find({ companyId: tenant.companyId }).lean(),
      attendanceModel.find(attFilter).sort({ date: -1 }).limit(50).lean(),
    ]);

    const onTimeCount = Math.max(0, attendanceTotal - lateCount);
    const onTimeRate =
      attendanceTotal > 0
        ? Math.round((onTimeCount / attendanceTotal) * 100)
        : 100;

    const totalMinutesLate = lateRecordsRaw.reduce(
      (acc, curr) => acc + (curr.minutesLate || 0),
      0,
    );
    const averageMinutesLate =
      lateCount > 0 ? Math.round(totalMinutesLate / lateCount) : 0;

    const lateRecords = lateRecordsRaw.map((r) => ({
      employeeName: r.employeeName,
      date: r.date,
      clockInTime: r.clockInTime,
      minutesLate: r.minutesLate || 15,
    }));

    const completedTasks = tasksRaw.filter(
      (t) => t.status === TaskStatus.COMPLETED,
    ).length;
    const openTasks = tasksRaw.length - completedTasks;
    const taskCompletionRate =
      tasksRaw.length > 0
        ? Math.round((completedTasks / tasksRaw.length) * 100)
        : 100;

    const departmentsSummary = departmentsRaw.map((d) => ({
      departmentId: d.departmentId,
      name: d.name,
      employeeCount: d.employeeCount || 0,
    }));

    // Details for single employee if selected
    let employeeDetail: FilteredAnalytics['employeeDetail'];
    if (singleEmployeeDoc) {
      employeeDetail = {
        employeeId: singleEmployeeDoc.employeeId,
        name: `${singleEmployeeDoc.firstName} ${singleEmployeeDoc.lastName}`.trim(),
        email: singleEmployeeDoc.email,
        departmentName: singleEmployeeDoc.departmentName || 'General Staff',
        designation: singleEmployeeDoc.designation || 'Team Member',
      };
    }

    const employeeTasks: EmployeeTaskItem[] = tasksRaw.map((t) => ({
      taskId: t.taskId,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ? String(t.dueDate) : undefined,
      totalTimeSpentMinutes: (t as any).totalTimeSpentMinutes || 0,
    }));

    const attendanceHistory: EmployeeAttendanceItem[] =
      attendanceHistoryRaw.map((a) => ({
        date: a.date,
        clockInTime: a.clockInTime,
        clockOutTime: a.clockOutTime,
        totalHours: a.totalHours || 0,
        status: a.status,
        isLate: !!a.isLate || a.status === AttendanceStatus.LATE,
        minutesLate: a.minutesLate || 0,
      }));

    return {
      period,
      startDate: query.startDate,
      endDate: query.endDate,
      totalEmployees,
      activeEmployees,
      totalDepartments,
      attendanceTotal,
      onTimeCount,
      lateCount,
      onTimeRate,
      totalMinutesLate,
      averageMinutesLate,
      lateRecords,
      openTasks,
      completedTasks,
      taskCompletionRate,
      departmentsSummary,
      employeeDetail,
      employeeTasks,
      attendanceHistory,
    };
  }

  // Synthesizes analytics into an executive Markdown report using Gemini AI
  async generateAiReport(
    tenant: TenantContext,
    query: { period?: string; departmentId?: string },
  ): Promise<{ reportMarkdown: string; modelUsed: string }> {
    const analytics = await this.getFilteredAnalytics(tenant, query);

    const companyModel = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );
    const company = await companyModel
      .findOne({ companyId: tenant.companyId })
      .lean();
    const companyName = company?.name || 'WorkivLab';

    return this.aiService.generateExecutiveReport(analytics, companyName);
  }

  // Fast aggregated counts for real-time sidebar badges
  async getSidebarCounts(
    tenant: TenantContext,
    user?: JwtPayload,
  ): Promise<SidebarCounts> {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    const [
      employeeModel,
      taskModel,
      meetingModel,
      attendanceModel,
      messageModel,
      expenseModel,
      todoModel,
      resignationModel,
    ] = await Promise.all([
      this.regionalDbManager.getModel<Employee>(
        tenant.region,
        Employee.name,
        EmployeeSchema,
      ),
      this.regionalDbManager.getModel<Task>(
        tenant.region,
        Task.name,
        TaskSchema,
      ),
      this.regionalDbManager.getModel<Meeting>(
        tenant.region,
        Meeting.name,
        MeetingSchema,
      ),
      this.regionalDbManager.getModel<Attendance>(
        tenant.region,
        Attendance.name,
        AttendanceSchema,
      ),
      this.regionalDbManager.getModel<Message>(
        tenant.region,
        Message.name,
        MessageSchema,
      ),
      this.regionalDbManager.getModel<Expense>(
        tenant.region,
        Expense.name,
        ExpenseSchema,
      ),
      this.regionalDbManager.getModel<PersonalTodo>(
        tenant.region,
        PersonalTodo.name,
        PersonalTodoSchema,
      ),
      this.regionalDbManager.getModel<Resignation>(
        tenant.region,
        Resignation.name,
        ResignationSchema,
      ),
    ]);

    const isElevated =
      user?.isOwner ||
      user?.role === 'OWNER' ||
      user?.role === 'ADMIN' ||
      (user?.permissions &&
        (user.permissions.includes('tasks.delete') ||
          user.permissions.includes('tasks.manage') ||
          user.permissions.includes('reports.view')));

    const taskQuery: Record<string, unknown> = {
      companyId: tenant.companyId,
      status: { $ne: TaskStatus.COMPLETED },
    };
    if (user?.userId && !isElevated) {
      taskQuery['$or'] = [
        { assigneeId: user.userId },
        { 'assignees.userId': user.userId },
        { createdBy: user.userId },
      ];
    }

    const messageQuery: Record<string, unknown> = {
      companyId: tenant.companyId,
    };
    if (user?.userId) {
      messageQuery['senderId'] = { $ne: user.userId };
      messageQuery['readBy'] = { $ne: user.userId };
    }

    const [
      employees,
      tasks,
      meetings,
      attendance,
      messages,
      expenses,
      todos,
      resignations,
    ] = await Promise.all([
      employeeModel.countDocuments({
        companyId: tenant.companyId,
        status: EmployeeStatus.ACTIVE,
      }),
      taskModel.countDocuments(taskQuery),
      meetingModel.countDocuments({
        companyId: tenant.companyId,
        status: MeetingStatus.SCHEDULED,
        startTime: { $gte: now },
      }),
      attendanceModel.countDocuments({
        companyId: tenant.companyId,
        date: todayStr,
      }),
      messageModel.countDocuments(messageQuery),
      expenseModel.countDocuments({
        companyId: tenant.companyId,
        status: ExpenseStatus.PENDING,
      }),
      todoModel.countDocuments({
        companyId: tenant.companyId,
        completed: false,
      }),
      resignationModel.countDocuments({
        companyId: tenant.companyId,
        status: { $in: [ResignationStatus.SUBMITTED, ResignationStatus.UNDER_REVIEW] },
      }),
    ]);

    return {
      employees,
      tasks,
      meetings,
      attendance,
      messages,
      expenses,
      todos,
      resignations,
    };
  }
}
