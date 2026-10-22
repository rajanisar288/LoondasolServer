import { Model } from 'mongoose';
import { MasterIdentityDocument } from '../../database/master.schema';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { PasswordService } from './password.service';
import { TokenService, GeneratedTokens } from './token.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto, ResendVerificationDto } from './dto/verify-email.dto';
import { MailService } from '../mail/mail.service';
import { RegionCode } from '../../common/constants/regions.constant';
import { JwtPayload } from './jwt.strategy';
import { UpdateProfileDto } from './dto/update-profile.dto';
export interface AuthSessionResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
    user: {
        userId: string;
        email: string;
        firstName: string;
        lastName: string;
        displayName: string;
        avatarUrl?: string;
        phone?: string;
        address?: string;
        dateOfBirth?: string;
        cnic?: string;
        bankDetails?: any;
        roleName: string;
        permissions: string[];
        isOwner: boolean;
        isSuperAdmin?: boolean;
        status: string;
        isEmailVerified?: boolean;
        branchId?: string;
        branchName?: string;
        branchTimezone?: string;
        branchCurrency?: string;
    };
    company: {
        companyId: string;
        name: string;
        region: RegionCode;
        timezone: string;
        currency: string;
        companyTimezone?: string;
        companyCurrency?: string;
        logoUrl?: string;
        subscription: {
            plan: string;
            status: string;
            trialEndsAt?: Date;
        };
    };
}
export declare class AuthService {
    private readonly masterIdentityModel;
    private readonly regionalDbManager;
    private readonly passwordService;
    private readonly tokenService;
    private readonly mailService;
    private readonly logger;
    constructor(masterIdentityModel: Model<MasterIdentityDocument>, regionalDbManager: RegionalDatabaseManager, passwordService: PasswordService, tokenService: TokenService, mailService: MailService);
    private resolveEffectiveLocale;
    register(dto: RegisterDto): Promise<AuthSessionResponse>;
    private registerCompany;
    private findEmployeeByInvitation;
    validateInvitation(token: string, email: string, preferredRegion?: string): Promise<{
        valid: boolean;
        email: string;
        firstName: string;
        lastName: string;
        companyName: string;
        designation: string;
        departmentName: string;
        branchName: string | undefined;
        branchId: string | undefined;
        departmentId: string | undefined;
        region: string;
        companyId: string;
        customFieldsTemplate: import("../employees/schemas/onboarding-form.schema").FormFieldDefinition[];
        onboardingConfig: import("mongoose").FlattenMaps<{
            requireCnic: boolean;
            requireAddress: boolean;
            requireBankDetails: boolean;
            allowBranchCustomForms: boolean;
            allowBranchDepartments: boolean;
        }> | {
            requireCnic: false;
            requireAddress: false;
            requireBankDetails: false;
        };
    }>;
    private registerEmployee;
    login(dto: LoginDto): Promise<AuthSessionResponse>;
    refresh(dto: RefreshTokenDto): Promise<GeneratedTokens>;
    logout(userPayload: JwtPayload): Promise<{
        success: boolean;
        message: string;
    }>;
    getCurrentSession(userPayload: JwtPayload): Promise<AuthSessionResponse>;
    updateProfile(userPayload: JwtPayload, dto: UpdateProfileDto): Promise<AuthSessionResponse>;
    verifyEmail(dto: VerifyEmailDto): Promise<AuthSessionResponse>;
    resendVerificationCode(dto: ResendVerificationDto): Promise<{
        success: boolean;
        message: string;
    }>;
    private getSessionForIdentity;
    forgotPassword(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyPasswordResetOtp(email: string, otp: string): Promise<{
        success: boolean;
        valid: boolean;
    }>;
    resetPassword(dto: {
        email: string;
        otp: string;
        newPassword: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
