import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Resignation } from './schemas/resignation.schema';
import { SubmitResignationDto, UpdateClearanceChecklistDto, UpdateResignationStatusDto } from './dto/resignation.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class ResignationsService {
    private readonly regionalDbManager;
    constructor(regionalDbManager: RegionalDatabaseManager);
    findAll(tenant: TenantContext, user: JwtPayload): Promise<Resignation[]>;
    findOne(tenant: TenantContext, resignationId: string): Promise<Resignation>;
    submit(tenant: TenantContext, user: JwtPayload, dto: SubmitResignationDto): Promise<Resignation>;
    updateClearance(tenant: TenantContext, user: JwtPayload, resignationId: string, dto: UpdateClearanceChecklistDto): Promise<Resignation>;
    updateStatus(tenant: TenantContext, user: JwtPayload, resignationId: string, dto: UpdateResignationStatusDto): Promise<Resignation>;
}
