export interface TenantContext {
    companyId: string;
    region: string;
    countryCode?: string;
    userId?: string;
    role?: string;
    permissions?: string[];
}
export declare const CurrentTenant: (...dataOrPipes: unknown[]) => ParameterDecorator;
