import { EmploymentType, EmployeeStatus } from '../schemas/employee.schema';
export declare class CreateEmployeeDto {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    departmentId?: string;
    designation: string;
    employmentType: EmploymentType;
    salary?: number;
    joiningDate?: string;
    permissions?: string[];
    roleName?: string;
    roleId?: string;
    branchId?: string;
    branchName?: string;
    taxPercentage?: number;
    customFields?: Record<string, any>;
    documents?: Array<{
        name: string;
        url: string;
        fileType?: string;
        uploadedAt?: Date;
    }>;
    userLocationRegion?: string;
}
export declare class UpdateEmployeeDto {
    phone?: string;
    departmentId?: string;
    designation?: string;
    employmentType?: EmploymentType;
    salary?: number;
    status?: EmployeeStatus;
    permissions?: string[];
    roleName?: string;
    roleId?: string;
    branchId?: string;
    branchName?: string;
    taxPercentage?: number;
    customFields?: Record<string, any>;
    documents?: Array<{
        name: string;
        url: string;
        fileType?: string;
        uploadedAt?: Date;
    }>;
    userLocationRegion?: string;
}
