export declare const ROLES: {
    readonly OWNER: "OWNER";
    readonly SUPERADMIN: "SUPERADMIN";
    readonly ADMIN: "ADMIN";
    readonly HR_MANAGER: "HR_MANAGER";
    readonly EMPLOYEE: "EMPLOYEE";
};
export type RoleName = (typeof ROLES)[keyof typeof ROLES] | (string & {});
