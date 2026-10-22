import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS } from '../constants/permissions.constant';
import { ROLES } from '../constants/roles.constant';

describe('PermissionsGuard (RBAC Protection)', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  function createMockContext(user: {
    role: string;
    permissions: string[];
  }): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access when endpoint does not declare required permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockContext({ role: ROLES.EMPLOYEE, permissions: [] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow OWNER role to bypass all permission requirements', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([PERMISSIONS.EMPLOYEES_SALARY_UPDATE]);
    const ctx = createMockContext({ role: ROLES.OWNER, permissions: [] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow user possessing all required permissions', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([
        PERMISSIONS.EMPLOYEES_VIEW,
        PERMISSIONS.EMPLOYEES_CREATE,
      ]);
    const ctx = createMockContext({
      role: ROLES.ADMIN,
      permissions: [PERMISSIONS.EMPLOYEES_VIEW, PERMISSIONS.EMPLOYEES_CREATE],
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException when user lacks required permission', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([PERMISSIONS.EMPLOYEES_SALARY_VIEW]);
    const ctx = createMockContext({
      role: ROLES.EMPLOYEE,
      permissions: [PERMISSIONS.EMPLOYEES_VIEW],
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
