import { SetMetadata } from '@nestjs/common';
import { PermissionCode } from '../constants/permissions.constant';

export const PERMISSIONS_KEY = 'required_permissions';

// Metadata decorator specifying permissions required to access a handler
export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
