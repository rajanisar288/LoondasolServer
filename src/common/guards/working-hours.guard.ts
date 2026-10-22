import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import {
  Company,
  CompanySchema,
} from '../../modules/companies/schemas/company.schema';
import { validateCompanyWorkingHours } from '../../modules/companies/working-hours.helper';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES } from '../constants/roles.constant';
import { JwtPayload } from '../../modules/auth/jwt.strategy';

@Injectable()
export class WorkingHoursGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly regionalDbManager: RegionalDatabaseManager,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;

    // Skip if user not authenticated or is company owner
    if (!user || !user.companyId || !user.region || user.role === ROLES.OWNER) {
      return true;
    }

    try {
      const companyModel = await this.regionalDbManager.getModel<Company>(
        user.region,
        Company.name,
        CompanySchema,
      );

      const company = await companyModel
        .findOne({ companyId: user.companyId })
        .lean();
      if (
        !company ||
        !company.workingHours?.enabled ||
        !company.workingHours?.loginRestriction
      ) {
        return true;
      }

      const check = validateCompanyWorkingHours(
        company.workingHours,
        company.timezone,
      );
      if (!check.allowed) {
        throw new ForbiddenException({
          statusCode: 403,
          code: 'COMPANY_OUTSIDE_WORKING_HOURS',
          message:
            check.message ||
            'Your company is currently outside its allowed login hours.',
        });
      }

      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      // Fail safely open on unexpected errors
      return true;
    }
  }
}
