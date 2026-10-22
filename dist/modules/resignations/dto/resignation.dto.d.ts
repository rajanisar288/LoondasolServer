import { ResignationStatus } from '../schemas/resignation.schema';
export declare class SubmitResignationDto {
    intendedLastWorkingDay: string;
    reason: string;
}
export declare class UpdateClearanceChecklistDto {
    itAssetsReturned?: boolean;
    accessRevoked?: boolean;
    idBadgeReturned?: boolean;
    financeDuesCleared?: boolean;
    knowledgeTransferDone?: boolean;
}
export declare class UpdateResignationStatusDto {
    status: ResignationStatus;
    exitInterviewNotes?: string;
}
