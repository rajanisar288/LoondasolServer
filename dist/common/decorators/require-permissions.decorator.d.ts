import { PermissionCode } from '../constants/permissions.constant';
export declare const PERMISSIONS_KEY = "required_permissions";
export declare const RequirePermissions: (...permissions: PermissionCode[]) => import("@nestjs/common").CustomDecorator<string>;
