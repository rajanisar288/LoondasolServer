import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService, AuthSessionResponse } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto, ResendVerificationDto } from './dto/verify-email.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtPayload } from './jwt.strategy';
import { GeneratedTokens } from './token.service';

import {
  ForgotPasswordDto,
  VerifyResetOtpDto,
  ResetPasswordDto,
} from './dto/password-reset.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a 6-digit password reset OTP to email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 6-digit password reset OTP' })
  async verifyOtp(@Body() dto: VerifyResetOtpDto) {
    return this.authService.verifyPasswordResetOtp(dto.email, dto.otp);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset account password with valid OTP' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Get('invitation')
  @ApiOperation({
    summary:
      'Validate employee invitation token and retrieve workspace metadata',
  })
  async validateInvitation(
    @Query('token') token: string,
    @Query('email') email: string,
    @Query('region') region?: string,
  ) {
    return this.authService.validateInvitation(token, email, region);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new company workspace or accept employee invite',
  })
  @ApiResponse({
    status: 201,
    description: 'User and company successfully registered',
  })
  async register(@Body() dto: RegisterDto): Promise<AuthSessionResponse> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with 6-digit confirmation code' })
  @ApiResponse({
    status: 200,
    description: 'Email verified and session returned',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<AuthSessionResponse> {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend 6-digit email verification code' })
  @ApiResponse({ status: 200, description: 'Verification code resent' })
  async resendVerification(
    @Body() dto: ResendVerificationDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.authService.resendVerificationCode(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate credentials and obtain regional session tokens',
  })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  async login(@Body() dto: LoginDto): Promise<AuthSessionResponse> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate and refresh access token using valid refresh token',
  })
  @ApiResponse({ status: 200, description: 'Tokens successfully refreshed' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<GeneratedTokens> {
    return this.authService.refresh(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke active refresh token and end session' })
  async logout(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean; message: string }> {
    return this.authService.logout(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve current authenticated session context' })
  async getMe(@CurrentUser() user: JwtPayload): Promise<AuthSessionResponse> {
    return this.authService.getCurrentSession(user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update personal profile details, photo, and address' })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<AuthSessionResponse> {
    return this.authService.updateProfile(user, dto);
  }
}
