import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (user && (user.isSuperAdmin || user.role === 'SUPERADMIN')) {
      return true;
    }
    throw new ForbiddenException('Access denied: Super Admin privilege required');
  }
}
