export declare enum RegistrationType {
    COMPANY = "company",
    EMPLOYEE = "employee"
}
export declare class RegisterDto {
    type: RegistrationType;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    companyPhone?: string;
    registrationNumber?: string;
    website?: string;
    industry?: string;
    companySize?: string;
    logoUrl?: string;
    country?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    address?: string;
    region?: string;
    subscriptionPlan?: string;
    paymentMethod?: string;
    paymentMethodId?: string;
    stripePaymentMethodId?: string;
    purchasedSeats?: number;
    timezone?: string;
    currency?: string;
    invitationToken?: string;
    dateOfBirth?: string;
    cnic?: string;
    bankDetails?: {
        bankName?: string;
        accountTitle?: string;
        accountNumber?: string;
        iban?: string;
        branchCode?: string;
    };
    companyRegion?: string;
    userLocationRegion?: string;
    customFields?: Record<string, any>;
    documents?: Array<{
        name: string;
        url: string;
        fileType?: string;
        uploadedAt?: Date;
    }>;
}
