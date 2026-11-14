"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const env_validation_1 = require("./config/env.validation");
const database_module_1 = require("./database/database.module");
const redis_module_1 = require("./database/redis.module");
const auth_module_1 = require("./modules/auth/auth.module");
const companies_module_1 = require("./modules/companies/companies.module");
const departments_module_1 = require("./modules/departments/departments.module");
const roles_module_1 = require("./modules/roles/roles.module");
const employees_module_1 = require("./modules/employees/employees.module");
const attendance_module_1 = require("./modules/attendance/attendance.module");
const leave_module_1 = require("./modules/leave/leave.module");
const tasks_module_1 = require("./modules/tasks/tasks.module");
const chat_module_1 = require("./modules/chat/chat.module");
const reports_module_1 = require("./modules/reports/reports.module");
const health_module_1 = require("./modules/health/health.module");
const mail_module_1 = require("./modules/mail/mail.module");
const upload_module_1 = require("./modules/upload/upload.module");
const ai_module_1 = require("./modules/ai/ai.module");
const broadcasts_module_1 = require("./modules/broadcasts/broadcasts.module");
const subscriptions_module_1 = require("./modules/subscriptions/subscriptions.module");
const kafka_module_1 = require("./modules/kafka/kafka.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const meetings_module_1 = require("./modules/meetings/meetings.module");
const branches_module_1 = require("./modules/branches/branches.module");
const payroll_module_1 = require("./modules/payroll/payroll.module");
const personal_todos_module_1 = require("./modules/personal-todos/personal-todos.module");
const resignations_module_1 = require("./modules/resignations/resignations.module");
const expenses_module_1 = require("./modules/expenses/expenses.module");
const marketing_module_1 = require("./modules/marketing/marketing.module");
const superadmin_module_1 = require("./modules/superadmin/superadmin.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const tenant_guard_1 = require("./common/guards/tenant.guard");
const permissions_guard_1 = require("./common/guards/permissions.guard");
const working_hours_guard_1 = require("./common/guards/working-hours.guard");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
const request_id_interceptor_1 = require("./common/interceptors/request-id.interceptor");
const country_middleware_1 = require("./common/middleware/country.middleware");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(country_middleware_1.CountryMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', 'server/.env'],
                validationSchema: env_validation_1.envValidationSchema,
                validationOptions: {
                    allowUnknown: true,
                    abortEarly: false,
                },
            }),
            database_module_1.DatabaseModule,
            redis_module_1.RedisModule,
            auth_module_1.AuthModule,
            companies_module_1.CompaniesModule,
            departments_module_1.DepartmentsModule,
            roles_module_1.RolesModule,
            employees_module_1.EmployeesModule,
            attendance_module_1.AttendanceModule,
            leave_module_1.LeaveModule,
            tasks_module_1.TasksModule,
            chat_module_1.ChatModule,
            reports_module_1.ReportsModule,
            health_module_1.HealthModule,
            mail_module_1.MailModule,
            upload_module_1.UploadModule,
            ai_module_1.AiModule,
            broadcasts_module_1.BroadcastsModule,
            subscriptions_module_1.SubscriptionsModule,
            kafka_module_1.KafkaModule,
            notifications_module_1.NotificationsModule,
            meetings_module_1.MeetingsModule,
            branches_module_1.BranchesModule,
            payroll_module_1.PayrollModule,
            personal_todos_module_1.PersonalTodosModule,
            resignations_module_1.ResignationsModule,
            expenses_module_1.ExpensesModule,
            marketing_module_1.MarketingModule,
            superadmin_module_1.SuperAdminModule,
        ],
        providers: [
            {
                provide: core_1.APP_FILTER,
                useClass: global_exception_filter_1.GlobalExceptionFilter,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: request_id_interceptor_1.RequestIdInterceptor,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: tenant_guard_1.TenantGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: permissions_guard_1.PermissionsGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: working_hours_guard_1.WorkingHoursGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map