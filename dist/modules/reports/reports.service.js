"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const employee_schema_1 = require("../employees/schemas/employee.schema");
const department_schema_1 = require("../departments/schemas/department.schema");
const leave_schema_1 = require("../leave/schemas/leave.schema");
const task_schema_1 = require("../tasks/schemas/task.schema");
const company_schema_1 = require("../companies/schemas/company.schema");
const attendance_schema_1 = require("../attendance/schemas/attendance.schema");
const meeting_schema_1 = require("../meetings/schemas/meeting.schema");
const ai_service_1 = require("../ai/ai.service");
const expense_schema_1 = require("../expenses/schemas/expense.schema");
const resignation_schema_1 = require("../resignations/schemas/resignation.schema");
const personal_todo_schema_1 = require("../personal-todos/schemas/personal-todo.schema");
const message_schema_1 = require("../chat/schemas/message.schema");
let ReportsService = class ReportsService {
    constructor(regionalDbManager, aiService) {
        this.regionalDbManager = regionalDbManager;
        this.aiService = aiService;
    }
    async getDashboardMetrics(tenant, query) {
        const employeeModel = await this.regionalDbManager.getModel(tenant.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
        const departmentModel = await this.regionalDbManager.getModel(tenant.region, department_schema_1.Department.name, department_schema_1.DepartmentSchema);
        const leaveModel = await this.regionalDbManager.getModel(tenant.region, leave_schema_1.Leave.name, leave_schema_1.LeaveSchema);
        const taskModel = await this.regionalDbManager.getModel(tenant.region, task_schema_1.Task.name, task_schema_1.TaskSchema);
        const companyModel = await this.regionalDbManager.getModel(tenant.region, company_schema_1.Company.name, company_schema_1.CompanySchema);
        const meetingModel = await this.regionalDbManager.getModel(tenant.region, meeting_schema_1.Meeting.name, meeting_schema_1.MeetingSchema);
        const attendanceModel = await this.regionalDbManager.getModel(tenant.region, attendance_schema_1.Attendance.name, attendance_schema_1.AttendanceSchema);
        const now = new Date();
        const currentYear = now.getFullYear();
        const todayStr = now.toISOString().slice(0, 10);
        const startOfMonth = new Date(currentYear, now.getMonth(), 1);
        const startOfMonthStr = startOfMonth.toISOString().slice(0, 10);
        const isOwner = tenant.role === 'OWNER';
        const hasReportPerms = isOwner ||
            tenant.permissions?.includes('reports.view') ||
            tenant.permissions?.includes('employees.view');
        const [company, rawMeetings, employeesWithDob] = await Promise.all([
            companyModel.findOne({ companyId: tenant.companyId }).lean(),
            meetingModel
                .find({
                companyId: tenant.companyId,
                status: { $in: [meeting_schema_1.MeetingStatus.SCHEDULED, meeting_schema_1.MeetingStatus.IN_PROGRESS] },
                startTime: { $gte: new Date(Date.now() - 4 * 3600000) },
            })
                .sort({ startTime: 1 })
                .limit(5)
                .lean(),
            employeeModel
                .find({
                companyId: tenant.companyId,
                status: employee_schema_1.EmployeeStatus.ACTIVE,
                dateOfBirth: { $exists: true, $ne: '' },
            })
                .select('employeeId firstName lastName departmentName designation dateOfBirth')
                .lean(),
        ]);
        const upcomingBirthdays = [];
        for (const emp of employeesWithDob || []) {
            if (!emp.dateOfBirth)
                continue;
            const parts = emp.dateOfBirth.split('-');
            if (parts.length < 3)
                continue;
            const month = parseInt(parts[1], 10);
            const day = parseInt(parts[2], 10);
            if (isNaN(month) || isNaN(day))
                continue;
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
        const upcomingMeetings = (rawMeetings || []).map((m) => ({
            meetingId: m.meetingId,
            title: m.title,
            startTime: m.startTime,
            endTime: m.endTime,
            meetingType: m.meetingType,
            hostName: m.hostName,
            roomId: m.roomId,
            status: m.status,
        }));
        const upcomingHolidays = this.calculateUpcomingHolidays();
        if (!hasReportPerms) {
            const [myAssignedTasks, myPendingLeaves, myAttendanceThisMonth, myEmployee] = await Promise.all([
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
                    status: leave_schema_1.LeaveStatus.PENDING,
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
            const myTasksCount = myAssignedTasks.filter((t) => t.status !== task_schema_1.TaskStatus.COMPLETED).length;
            const myCompletedTasksCount = myAssignedTasks.filter((t) => t.status === task_schema_1.TaskStatus.COMPLETED).length;
            const myHoursLogged = Math.round(myAttendanceThisMonth.reduce((acc, curr) => acc + (curr.totalHours || 0), 0) * 10) / 10;
            const clockedInToday = myAttendanceThisMonth.some((r) => r.date === todayStr);
            const myLateToday = myAttendanceThisMonth.find((r) => r.date === todayStr && (r.isLate || r.status === attendance_schema_1.AttendanceStatus.LATE));
            const personalLateEmployees = myLateToday
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
                    plan: company?.subscription?.plan || 'PRO',
                    status: company?.subscription?.status || 'ACTIVE',
                    trialEndsAt: company?.subscription?.trialEndsAt,
                },
                aiUsage: {
                    used: company?.subscription?.aiRequestsUsedThisMonth ?? 0,
                    limit: company?.subscription?.aiRequestLimit ?? 5000,
                    plan: company?.subscription?.plan || 'PRO',
                },
                seatUsage: {
                    purchasedSeats: company?.subscription?.purchasedSeats ?? 5,
                    totalActiveSeats: 1,
                    availableSeats: Math.max(0, (company?.subscription?.purchasedSeats ?? 5) - 1),
                },
                upcomingMeetings,
                upcomingBirthdays: topBirthdays,
                upcomingHolidays,
                lateEmployees: personalLateEmployees,
            };
        }
        const period = query?.period || 'today';
        let taskDateFilter;
        if (period === 'today') {
            taskDateFilter = {
                $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            };
        }
        else if (period === 'weekly' || period === 'this_week') {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            taskDateFilter = { $gte: d };
        }
        else if (period === 'monthly' || period === 'this_month') {
            taskDateFilter = { $gte: startOfMonth };
        }
        else if (period === 'custom' && query?.startDate) {
            const start = new Date(query.startDate);
            if (query.endDate) {
                const end = new Date(query.endDate);
                end.setHours(23, 59, 59, 999);
                taskDateFilter = { $gte: start, $lte: end };
            }
            else {
                taskDateFilter = { $gte: start };
            }
        }
        const taskMatch = { companyId: tenant.companyId };
        if (taskDateFilter) {
            taskMatch['createdAt'] = taskDateFilter;
        }
        const [totalEmployees, activeEmployees, employeesOnLeave, totalDepartments, pendingLeaves, openTasks, completedTasks, todayAttendanceRecords,] = await Promise.all([
            employeeModel.countDocuments({ companyId: tenant.companyId }),
            employeeModel.countDocuments({
                companyId: tenant.companyId,
                status: employee_schema_1.EmployeeStatus.ACTIVE,
            }),
            employeeModel.countDocuments({
                companyId: tenant.companyId,
                status: employee_schema_1.EmployeeStatus.ON_LEAVE,
            }),
            departmentModel.countDocuments({ companyId: tenant.companyId }),
            leaveModel.countDocuments({
                companyId: tenant.companyId,
                status: leave_schema_1.LeaveStatus.PENDING,
            }),
            taskModel.countDocuments({
                companyId: tenant.companyId,
                status: { $ne: task_schema_1.TaskStatus.COMPLETED },
                ...(taskDateFilter ? { createdAt: taskDateFilter } : {}),
            }),
            taskModel.countDocuments({
                companyId: tenant.companyId,
                status: task_schema_1.TaskStatus.COMPLETED,
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
        const todayLateRecords = todayAttendanceRecords.filter((r) => r.status === attendance_schema_1.AttendanceStatus.LATE ||
            r.isLate ||
            (r.minutesLate && r.minutesLate > 0));
        const todayLateCount = todayLateRecords.length;
        const todayAbsentCount = Math.max(0, activeEmployees - todayPresentCount);
        const empDeptMap = new Map();
        for (const e of employeesWithDob || []) {
            if (e.departmentName)
                empDeptMap.set(e.employeeId, e.departmentName);
        }
        const lateEmployees = todayLateRecords.map((r) => {
            let dept = r.departmentName;
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
                plan: company?.subscription?.plan || 'PRO',
                status: company?.subscription?.status || 'ACTIVE',
                trialEndsAt: company?.subscription?.trialEndsAt,
            },
            aiUsage: {
                used: company?.subscription?.aiRequestsUsedThisMonth ?? 0,
                limit: company?.subscription?.aiRequestLimit ?? 5000,
                plan: company?.subscription?.plan || 'PRO',
            },
            seatUsage: {
                purchasedSeats: company?.subscription?.purchasedSeats ?? 5,
                totalActiveSeats: activeEmployees + 1,
                availableSeats: Math.max(0, (company?.subscription?.purchasedSeats ?? 5) - (activeEmployees + 1)),
            },
            upcomingMeetings,
            upcomingBirthdays: topBirthdays,
            upcomingHolidays,
            lateEmployees,
        };
    }
    calculateUpcomingHolidays() {
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
        const upcoming = [];
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
    async getFilteredAnalytics(tenant, query) {
        const employeeModel = await this.regionalDbManager.getModel(tenant.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
        const departmentModel = await this.regionalDbManager.getModel(tenant.region, department_schema_1.Department.name, department_schema_1.DepartmentSchema);
        const attendanceModel = await this.regionalDbManager.getModel(tenant.region, attendance_schema_1.Attendance.name, attendance_schema_1.AttendanceSchema);
        const taskModel = await this.regionalDbManager.getModel(tenant.region, task_schema_1.Task.name, task_schema_1.TaskSchema);
        const period = query.period || 'this_month';
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        let dateFilter;
        if (period === 'today') {
            dateFilter = { $eq: todayStr };
        }
        else if (period === 'this_week' || period === '7days') {
            const past7 = new Date();
            past7.setDate(past7.getDate() - 7);
            dateFilter = { $gte: past7.toISOString().slice(0, 10) };
        }
        else if (period === 'this_month' || period === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { $gte: startOfMonth.toISOString().slice(0, 10) };
        }
        else if (period === 'last_month') {
            const startOfLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLast = new Date(now.getFullYear(), now.getMonth(), 0);
            dateFilter = {
                $gte: startOfLast.toISOString().slice(0, 10),
                $lte: endOfLast.toISOString().slice(0, 10),
            };
        }
        else if (period === '30days') {
            const past30 = new Date();
            past30.setDate(past30.getDate() - 30);
            dateFilter = { $gte: past30.toISOString().slice(0, 10) };
        }
        else if (period === 'custom' && (query.startDate || query.endDate)) {
            if (query.startDate && query.endDate) {
                dateFilter = { $gte: query.startDate, $lte: query.endDate };
            }
            else if (query.startDate) {
                dateFilter = { $gte: query.startDate };
            }
            else if (query.endDate) {
                dateFilter = { $lte: query.endDate };
            }
        }
        const isOwner = tenant.role === 'OWNER';
        const canViewAllReports = isOwner ||
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
        let employeeIds;
        let singleEmployeeDoc = null;
        if (query.employeeId) {
            singleEmployeeDoc = await employeeModel
                .findOne({ companyId: tenant.companyId, employeeId: query.employeeId })
                .lean();
            employeeIds = [query.employeeId];
        }
        else if (query.departmentId) {
            const deptEmps = await employeeModel
                .find({ companyId: tenant.companyId, departmentId: query.departmentId }, { employeeId: 1 })
                .lean();
            employeeIds = deptEmps.map((e) => e.employeeId);
        }
        const attFilter = { companyId: tenant.companyId };
        if (dateFilter)
            attFilter['date'] = dateFilter;
        if (employeeIds)
            attFilter['employeeId'] = { $in: employeeIds };
        const taskQuery = { companyId: tenant.companyId };
        if (singleEmployeeDoc) {
            taskQuery['$or'] = [
                { 'assignees.userId': singleEmployeeDoc.userId },
                { 'assignees.userId': singleEmployeeDoc.employeeId },
            ];
        }
        else if (employeeIds && employeeIds.length > 0) {
            taskQuery['assignees.userId'] = { $in: employeeIds };
        }
        const [totalEmployees, activeEmployees, totalDepartments, attendanceTotal, lateCount, lateRecordsRaw, tasksRaw, departmentsRaw, attendanceHistoryRaw,] = await Promise.all([
            employeeModel.countDocuments({ companyId: tenant.companyId }),
            employeeModel.countDocuments({
                companyId: tenant.companyId,
                status: employee_schema_1.EmployeeStatus.ACTIVE,
            }),
            departmentModel.countDocuments({ companyId: tenant.companyId }),
            attendanceModel.countDocuments(attFilter),
            attendanceModel.countDocuments({
                ...attFilter,
                $or: [{ status: attendance_schema_1.AttendanceStatus.LATE }, { isLate: true }],
            }),
            attendanceModel
                .find({
                ...attFilter,
                $or: [{ status: attendance_schema_1.AttendanceStatus.LATE }, { isLate: true }],
            })
                .sort({ date: -1, minutesLate: -1 })
                .limit(20)
                .lean(),
            taskModel.find(taskQuery).sort({ updatedAt: -1 }).limit(50).lean(),
            departmentModel.find({ companyId: tenant.companyId }).lean(),
            attendanceModel.find(attFilter).sort({ date: -1 }).limit(50).lean(),
        ]);
        const onTimeCount = Math.max(0, attendanceTotal - lateCount);
        const onTimeRate = attendanceTotal > 0
            ? Math.round((onTimeCount / attendanceTotal) * 100)
            : 100;
        const totalMinutesLate = lateRecordsRaw.reduce((acc, curr) => acc + (curr.minutesLate || 0), 0);
        const averageMinutesLate = lateCount > 0 ? Math.round(totalMinutesLate / lateCount) : 0;
        const lateRecords = lateRecordsRaw.map((r) => ({
            employeeName: r.employeeName,
            date: r.date,
            clockInTime: r.clockInTime,
            minutesLate: r.minutesLate || 15,
        }));
        const completedTasks = tasksRaw.filter((t) => t.status === task_schema_1.TaskStatus.COMPLETED).length;
        const openTasks = tasksRaw.length - completedTasks;
        const taskCompletionRate = tasksRaw.length > 0
            ? Math.round((completedTasks / tasksRaw.length) * 100)
            : 100;
        const departmentsSummary = departmentsRaw.map((d) => ({
            departmentId: d.departmentId,
            name: d.name,
            employeeCount: d.employeeCount || 0,
        }));
        let employeeDetail;
        if (singleEmployeeDoc) {
            employeeDetail = {
                employeeId: singleEmployeeDoc.employeeId,
                name: `${singleEmployeeDoc.firstName} ${singleEmployeeDoc.lastName}`.trim(),
                email: singleEmployeeDoc.email,
                departmentName: singleEmployeeDoc.departmentName || 'General Staff',
                designation: singleEmployeeDoc.designation || 'Team Member',
            };
        }
        const employeeTasks = tasksRaw.map((t) => ({
            taskId: t.taskId,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate ? String(t.dueDate) : undefined,
            totalTimeSpentMinutes: t.totalTimeSpentMinutes || 0,
        }));
        const attendanceHistory = attendanceHistoryRaw.map((a) => ({
            date: a.date,
            clockInTime: a.clockInTime,
            clockOutTime: a.clockOutTime,
            totalHours: a.totalHours || 0,
            status: a.status,
            isLate: !!a.isLate || a.status === attendance_schema_1.AttendanceStatus.LATE,
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
    async generateAiReport(tenant, query) {
        const analytics = await this.getFilteredAnalytics(tenant, query);
        const companyModel = await this.regionalDbManager.getModel(tenant.region, company_schema_1.Company.name, company_schema_1.CompanySchema);
        const company = await companyModel
            .findOne({ companyId: tenant.companyId })
            .lean();
        const companyName = company?.name || 'WorkivLab';
        return this.aiService.generateExecutiveReport(analytics, companyName);
    }
    async getSidebarCounts(tenant, user) {
        const todayStr = new Date().toISOString().split('T')[0];
        const now = new Date();
        const [employeeModel, taskModel, meetingModel, attendanceModel, messageModel, expenseModel, todoModel, resignationModel,] = await Promise.all([
            this.regionalDbManager.getModel(tenant.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema),
            this.regionalDbManager.getModel(tenant.region, task_schema_1.Task.name, task_schema_1.TaskSchema),
            this.regionalDbManager.getModel(tenant.region, meeting_schema_1.Meeting.name, meeting_schema_1.MeetingSchema),
            this.regionalDbManager.getModel(tenant.region, attendance_schema_1.Attendance.name, attendance_schema_1.AttendanceSchema),
            this.regionalDbManager.getModel(tenant.region, message_schema_1.Message.name, message_schema_1.MessageSchema),
            this.regionalDbManager.getModel(tenant.region, expense_schema_1.Expense.name, expense_schema_1.ExpenseSchema),
            this.regionalDbManager.getModel(tenant.region, personal_todo_schema_1.PersonalTodo.name, personal_todo_schema_1.PersonalTodoSchema),
            this.regionalDbManager.getModel(tenant.region, resignation_schema_1.Resignation.name, resignation_schema_1.ResignationSchema),
        ]);
        const isElevated = user?.isOwner ||
            user?.role === 'OWNER' ||
            user?.role === 'ADMIN' ||
            (user?.permissions &&
                (user.permissions.includes('tasks.delete') ||
                    user.permissions.includes('tasks.manage') ||
                    user.permissions.includes('reports.view')));
        const taskQuery = {
            companyId: tenant.companyId,
            status: { $ne: task_schema_1.TaskStatus.COMPLETED },
        };
        if (user?.userId && !isElevated) {
            taskQuery['$or'] = [
                { assigneeId: user.userId },
                { 'assignees.userId': user.userId },
                { createdBy: user.userId },
            ];
        }
        const messageQuery = {
            companyId: tenant.companyId,
        };
        if (user?.userId) {
            messageQuery['senderId'] = { $ne: user.userId };
            messageQuery['readBy'] = { $ne: user.userId };
        }
        const [employees, tasks, meetings, attendance, messages, expenses, todos, resignations,] = await Promise.all([
            employeeModel.countDocuments({
                companyId: tenant.companyId,
                status: employee_schema_1.EmployeeStatus.ACTIVE,
            }),
            taskModel.countDocuments(taskQuery),
            meetingModel.countDocuments({
                companyId: tenant.companyId,
                status: meeting_schema_1.MeetingStatus.SCHEDULED,
                startTime: { $gte: now },
            }),
            attendanceModel.countDocuments({
                companyId: tenant.companyId,
                date: todayStr,
            }),
            messageModel.countDocuments(messageQuery),
            expenseModel.countDocuments({
                companyId: tenant.companyId,
                status: expense_schema_1.ExpenseStatus.PENDING,
            }),
            todoModel.countDocuments({
                companyId: tenant.companyId,
                completed: false,
            }),
            resignationModel.countDocuments({
                companyId: tenant.companyId,
                status: { $in: [resignation_schema_1.ResignationStatus.SUBMITTED, resignation_schema_1.ResignationStatus.UNDER_REVIEW] },
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
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [regional_database_manager_1.RegionalDatabaseManager,
        ai_service_1.AiService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map