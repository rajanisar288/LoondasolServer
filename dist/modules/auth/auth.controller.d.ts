import { AuthService, AuthSessionResponse } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto, ResendVerificationDto } from './dto/verify-email.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './jwt.strategy';
import { GeneratedTokens } from './token.service';
import { ForgotPasswordDto, VerifyResetOtpDto, ResetPasswordDto } from './dto/password-reset.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(dto: VerifyResetOtpDto): Promise<{
        success: boolean;
        valid: boolean;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    validateInvitation(token: string, email: string, region?: string): Promise<{
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
    register(dto: RegisterDto): Promise<AuthSessionResponse>;
    verifyEmail(dto: VerifyEmailDto): Promise<AuthSessionResponse>;
    resendVerification(dto: ResendVerificationDto): Promise<{
        success: boolean;
        message: string;
    }>;
    login(dto: LoginDto): Promise<AuthSessionResponse>;
    refresh(dto: RefreshTokenDto): Promise<GeneratedTokens>;
    logout(user: JwtPayload): Promise<{
        success: boolean;
        message: string;
    }>;
    getMe(user: JwtPayload): Promise<AuthSessionResponse>;
    updateProfile(user: JwtPayload, dto: UpdateProfileDto): Promise<AuthSessionResponse>;
}
