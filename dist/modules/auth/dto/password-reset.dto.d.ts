export declare class ForgotPasswordDto {
    email: string;
}
export declare class VerifyResetOtpDto {
    email: string;
    otp: string;
}
export declare class ResetPasswordDto {
    email: string;
    otp: string;
    newPassword: string;
}
