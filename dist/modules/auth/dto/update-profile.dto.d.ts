export declare class UpdateBankDetailsDto {
    bankName?: string;
    accountTitle?: string;
    accountNumber?: string;
    iban?: string;
    branchCode?: string;
}
export declare class UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    cnic?: string;
    bankDetails?: UpdateBankDetailsDto;
}
