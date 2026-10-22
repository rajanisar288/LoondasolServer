export declare class CreateOnboardingFormDto {
    title: string;
    branchId?: string;
    branchName?: string;
    departmentId?: string;
    departmentName?: string;
    isDefault?: boolean;
    fields: Array<{
        id: string;
        label: string;
        type: 'text' | 'number' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'date' | 'file';
        required: boolean;
        options?: string[];
        placeholder?: string;
        helperText?: string;
    }>;
}
export declare class UpdateOnboardingFormDto extends CreateOnboardingFormDto {
}
