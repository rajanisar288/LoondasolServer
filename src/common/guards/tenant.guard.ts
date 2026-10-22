import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (
      request as unknown as { user?: { companyId?: string; region?: string } }
    ).user;

    // Public or unauthenticated routes are checked by JwtAuthGuard
    if (!user || !user.companyId) {
      return true;
    }

    // Inspect request body to detect any attempt to spoof or override tenant boundary
    const body = request.body as Record<string, unknown> | undefined;
    if (body && typeof body === 'object' && 'companyId' in body) {
      if (body.companyId !== user.companyId) {
        throw new ForbiddenException(
          'Cross-tenant data injection attempt detected',
        );
      }
    }

    // Inspect query parameters
    const query = request.query as Record<string, unknown> | undefined;
    if (query && typeof query === 'object' && 'companyId' in query) {
      if (query.companyId !== user.companyId) {
        throw new ForbiddenException('Cross-tenant query attempt detected');
      }
    }

    // Inspect route parameters
    const params = request.params as Record<string, unknown> | undefined;
    if (params && typeof params === 'object' && 'companyId' in params) {
      if (params.companyId !== user.companyId) {
        throw new ForbiddenException(
          'Cross-tenant resource access attempt detected',
        );
      }
    }

    return true;
  }
}
