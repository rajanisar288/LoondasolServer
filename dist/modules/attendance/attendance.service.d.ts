import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Attendance } from './schemas/attendance.schema';
import { ClockInDto, ClockOutDto, ManualAttendanceDto } from './dto/attendance.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class AttendanceService {
    private readonly regionalDbManager;
    constructor(regionalDbManager: RegionalDatabaseManager);
    private getEffectiveWorkContext;
    clockIn(tenant: TenantContext, user: JwtPayload, dto: ClockInDto): Promise<Attendance>;
    clockOut(tenant: TenantContext, user: JwtPayload, dto: ClockOutDto): Promise<Attendance>;
    manualPunch(tenant: TenantContext, user: JwtPayload, dto: ManualAttendanceDto): Promise<Attendance>;
    private buildDateTime;
    private extractHourMinute;
    getTodayStatus(tenant: TenantContext, user: JwtPayload): Promise<Attendance | null>;
    findAll(tenant: TenantContext, user: JwtPayload, date?: string): Promise<Attendance[]>;
}
