import { ResignationsService } from './resignations.service';
import { SubmitResignationDto, UpdateClearanceChecklistDto, UpdateResignationStatusDto } from './dto/resignation.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { Resignation } from './schemas/resignation.schema';
export declare class ResignationsController {
    private readonly resignationsService;
    constructor(resignationsService: ResignationsService);
    findAll(tenant: TenantContext, user: JwtPayload): Promise<Resignation[]>;
    findOne(tenant: TenantContext, id: string): Promise<Resignation>;
    submit(tenant: TenantContext, user: JwtPayload, dto: SubmitResignationDto): Promise<Resignation>;
    updateClearance(tenant: TenantContext, user: JwtPayload, id: string, dto: UpdateClearanceChecklistDto): Promise<Resignation>;
    updateStatus(tenant: TenantContext, user: JwtPayload, id: string, dto: UpdateResignationStatusDto): Promise<Resignation>;
}
