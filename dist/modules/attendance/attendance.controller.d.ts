import { AttendanceService } from './attendance.service';
import { ClockInDto, ClockOutDto, ManualAttendanceDto } from './dto/attendance.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { Attendance } from './schemas/attendance.schema';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    clockIn(tenant: TenantContext, user: JwtPayload, dto: ClockInDto): Promise<Attendance>;
    clockOut(tenant: TenantContext, user: JwtPayload, dto: ClockOutDto): Promise<Attendance>;
    manualPunch(tenant: TenantContext, user: JwtPayload, dto: ManualAttendanceDto): Promise<Attendance>;
    getToday(tenant: TenantContext, user: JwtPayload): Promise<Attendance | null>;
    findAll(tenant: TenantContext, user: JwtPayload, date?: string): Promise<Attendance[]>;
}
