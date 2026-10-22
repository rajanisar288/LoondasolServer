// Core Role Identifiers
export const ROLES = {
  OWNER: 'OWNER',
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES] | (string & {});
