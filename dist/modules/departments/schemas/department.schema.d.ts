import { Document } from 'mongoose';
export type DepartmentDocument = Department & Document;
export declare class Department {
    departmentId: string;
    companyId: string;
    name: string;
    description?: string;
    managerId?: string;
    managerName?: string;
    branchId?: string;
    branchName?: string;
    isCompanyWide: boolean;
    employeeCount: number;
}
export declare const DepartmentSchema: import("mongoose").Schema<Department, import("mongoose").Model<Department, any, any, any, Document<unknown, any, Department, any, {}> & Department & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Department, Document<unknown, {}, import("mongoose").FlatRecord<Department>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Department> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
