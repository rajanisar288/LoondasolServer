export declare class CreateDepartmentDto {
    name: string;
    description?: string;
    managerId?: string;
    branchId?: string;
    branchName?: string;
    isCompanyWide?: boolean;
}
export declare class UpdateDepartmentDto {
    name?: string;
    description?: string;
    managerId?: string;
    branchId?: string;
    branchName?: string;
    isCompanyWide?: boolean;
}
