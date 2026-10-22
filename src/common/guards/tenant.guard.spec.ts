import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';

describe('TenantGuard (Isolation Protection)', () => {
  let guard: TenantGuard;

  beforeEach(() => {
    guard = new TenantGuard();
  });

  function createMockContext(
    userCompanyId: string,
    body?: Record<string, unknown>,
    query?: Record<string, unknown>,
  ): ExecutionContext {
    const request = {
      user: {
        userId: 'usr_123',
        companyId: userCompanyId,
        region: 'PK',
      },
      body: body || {},
      query: query || {},
      params: {},
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow requests where body companyId matches authenticated tenant', () => {
    const ctx = createMockContext('comp_AAA', {
      companyId: 'comp_AAA',
      name: 'Valid Resource',
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should reject requests where body attempts to inject a different companyId', () => {
    const ctx = createMockContext('comp_AAA', {
      companyId: 'comp_BBB',
      name: 'Malicious Resource',
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should reject requests where query attempts cross-tenant access', () => {
    const ctx = createMockContext('comp_AAA', {}, { companyId: 'comp_BBB' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should allow requests when body does not specify companyId', () => {
    const ctx = createMockContext('comp_AAA', { name: 'Standard Payload' });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
