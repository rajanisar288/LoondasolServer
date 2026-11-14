import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { envValidationSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './database/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { RolesModule } from './modules/roles/roles.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { LeaveModule } from './modules/leave/leave.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ChatModule } from './modules/chat/chat.module';
import { ReportsModule } from './modules/reports/reports.module';
import { HealthModule } from './modules/health/health.module';
import { MailModule } from './modules/mail/mail.module';
import { UploadModule } from './modules/upload/upload.module';
import { AiModule } from './modules/ai/ai.module';
import { BroadcastsModule } from './modules/broadcasts/broadcasts.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { KafkaModule } from './modules/kafka/kafka.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { BranchesModule } from './modules/branches/branches.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { PersonalTodosModule } from './modules/personal-todos/personal-todos.module';
import { ResignationsModule } from './modules/resignations/resignations.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { SuperAdminModule } from './modules/superadmin/superadmin.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { WorkingHoursGuard } from './common/guards/working-hours.guard';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { CountryMiddleware } from './common/middleware/country.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'server/.env'],
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    CompaniesModule,
    DepartmentsModule,
    RolesModule,
    EmployeesModule,
    AttendanceModule,
    LeaveModule,
    TasksModule,
    ChatModule,
    ReportsModule,
    HealthModule,
    MailModule,
    UploadModule,
    AiModule,
    BroadcastsModule,
    SubscriptionsModule,
    KafkaModule,
    NotificationsModule,
    MeetingsModule,
    BranchesModule,
    PayrollModule,
    PersonalTodosModule,
    ResignationsModule,
    ExpensesModule,
    MarketingModule,
    SuperAdminModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestIdInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: WorkingHoursGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CountryMiddleware).forRoutes('*');
  }
}
