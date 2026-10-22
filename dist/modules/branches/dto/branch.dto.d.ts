export declare class BranchWorkingHoursDto {
    enabled: boolean;
    startTime: string;
    endTime: string;
    workingDays: number[];
    enforceLoginRestriction: boolean;
}
export declare class CreateBranchDto {
    name: string;
    address: string;
    phone?: string;
    timezone?: string;
    currency?: string;
    workingHours?: BranchWorkingHoursDto;
}
export declare class UpdateBranchDto {
    name?: string;
    address?: string;
    phone?: string;
    timezone?: string;
    currency?: string;
    workingHours?: BranchWorkingHoursDto;
}
