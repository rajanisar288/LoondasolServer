import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { PermissionCode } from '../constants/permissions.constant';
import { ROLES } from '../constants/roles.constant';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionCode[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    // If no specific permissions are decorated, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User context is missing from request');
    }

    // Owner or Admin role automatically bypasses individual permission checks
    const roleUpper = String(user.role || '').toUpperCase();
    if (
      user.isOwner === true ||
      roleUpper === ROLES.OWNER ||
      roleUpper === ROLES.ADMIN ||
      roleUpper === 'OWNER' ||
      roleUpper === 'ADMIN'
    ) {
      return true;
    }

    const userPermissions: string[] = user.permissions || [];
    const hasAny = requiredPermissions.some((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasAny) {
      throw new ForbiddenException(
        `Insufficient permissions. Required one of: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
